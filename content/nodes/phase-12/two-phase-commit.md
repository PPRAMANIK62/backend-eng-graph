---
id: two-phase-commit
title: Two-phase commit
depth: deep
phase: 12
note: >-
  Prepare then commit across machines, and what happens when the
  coordinator dies.
needs: [transaction, failure-detection]
leads_to: [sagas, distributed-transactions, transactional-sinks]
compare_with: [sagas, delivery-guarantees, consensus]
---

# Two-phase commit

Two-phase commit (2PC) is the classic way to make one
[[transaction]] span several machines: either every machine commits
its part, or every machine throws its part away. It works by asking
everyone "can you commit?" before telling anyone "commit". It's also
famous for one weakness: if the machine running the protocol dies at
the wrong moment, everyone else is stuck waiting for it.

## One transfer, two databases

Take the bank transfer from the [[transaction]] article, but now
Alice's account lives in database A and Bob's in database B. Moving
100 from Alice to Bob needs a debit in A and a credit in B, and you
want the same all-or-nothing promise a single database gives you.

The naive way is to commit in A, then commit in B. If the process
doing it crashes between the two commits, Alice has lost 100 and Bob
never got it. Commit in the other order and the crash creates money
instead. Each database only knows about its own half, so neither can
fix it.

What you need is for the two databases to agree on one outcome,
commit or abort, and then both carry it out. That agreement problem
is called atomic commit. It has two rules that make it stricter than
it looks:

- The transaction commits only if every participant is willing. One
  "no" and it aborts.
- No participant may end up committed while another ends up aborted.

2PC solves it with one extra role, the **coordinator**. It can be a
separate service, or part of the client that runs the transaction. The
databases doing the work are the **participants**. (Gray and Lamport
call them the transaction manager and resource managers.)

## Phase one: prepare

The client runs the transfer as a normal transaction in each database:
`UPDATE` in A, `UPDATE` in B, neither committed. When it's ready, it
asks the coordinator to commit, and the coordinator sends **prepare**
to each participant.

Prepare is a question with a heavy promise attached. A participant
that answers yes is promising it can commit later, whatever happens in
between, including its own crash and restart. So before it votes yes,
it must:

- write all of the transaction's changes to disk, along with a record
  saying "prepared",
- check every constraint that could still make the commit fail,
- and keep holding the transaction's locks.

If it can't do all that (a constraint fails, or it has already
aborted the transaction), it votes no. A participant can
also abort on its own at any point before it votes.

## Phase two: commit or abort

The coordinator collects the votes:

- If everyone voted yes, it decides **commit**.
- If anyone voted no, or anyone failed to answer before a timeout, it
  decides **abort**.

It writes that decision to its own log on disk. That write is the
commit point: from then on the transaction is committed, even if every
machine loses power a moment later. Then it sends the decision to
every participant, and each one commits (or rolls back) and releases
its locks.

![Sequence diagram with three lanes: coordinator, participant A (Alice's database) and participant B (Bob's database). The coordinator sends PREPARE to both. Each writes its changes and a prepare record and keeps its locks, then sends YES. The coordinator writes COMMIT to its log, marked as the commit point, then sends COMMIT to both. Each commits and releases its locks. On participant A's lane, the stretch from sending YES to receiving COMMIT is marked "in doubt: voted yes, can't decide alone, locks still held".](img/two-phase-commit-sequence.svg)

*Two-phase commit in the normal case, and the window where a participant can't decide on its own. Adapted from Jim Gray and Leslie Lamport, "Consensus on Transaction Commit", figure 2 (2006).*

The rule that makes crashes survivable is simple: every process writes
its current state to disk before it sends any message from that state.
The participant logs "prepared" before voting yes; the coordinator
logs "commit" before sending commit. A process that crashes and
restarts reads its log and carries on where it was. That's why every
participant needs a [[write-ahead-log]] that can hold a prepared
transaction across a restart.

## What it costs

In the normal case, with N participants and the coordinator on its own
machine, the transaction needs four one-way message delays before the
participants learn it committed, and 3N − 1 messages in total. If
the coordinator runs on the same machine as one participant, that
drops to three message delays.

On top of the messages, there are forced disk writes on the critical
path: each participant's prepare record and the coordinator's decision.
If the participants prepare at the same time, that's two forced writes
to stable storage in a row, each one waiting on something like an
[[fsync]].

And there are locks. Every participant holds its locks from the moment
it prepares until the decision arrives, so any other transaction that
wants those rows waits for the slowest participant and the round trips
in between.

## When the coordinator dies

Now the famous problem. Say both databases voted yes, and the
coordinator crashes before anyone hears its decision.

Participant A is now **in doubt**. It promised it could commit, so it
can't abort on its own: the coordinator may have decided commit, and B
may already have committed. It can't commit on its own either: the
coordinator may have decided abort after a timeout. Whatever A does
alone could break the one rule 2PC exists for. So it waits, holding its
locks, until the coordinator comes back and tells it.

That is what "2PC is a blocking protocol" means. Before a participant
votes, a missing coordinator is harmless: the participant can time out
and abort. After it votes yes, it can only wait. A coordinator that
stays down for an hour leaves locked rows for an hour.

Timeouts don't rescue you here. As [[failure-detection]] explains, a
timeout can't tell a dead coordinator from a slow one or from a lost
message, and acting on a wrong guess is exactly what breaks atomicity.

## Taking the single point of failure out

People have tried two ways to fix blocking.

**Three-phase commit** adds a round so participants can finish without
the coordinator. It assumes a synchronous network, with bounded message
delays, which real networks don't give you. Gray and Lamport point out
that none of the published versions came with a complete algorithm
proven correct under a clearly stated fault model. You'll meet the name,
rarely the protocol.

**Replace the coordinator with [[consensus]].** The coordinator's
problem is that one machine holds the decision. Paxos Commit runs a
[[paxos|Paxos]] instance for each participant's vote, with 2F + 1
acceptors, and keeps making progress as long as F + 1 of them work. It
has the same disk-write delays as 2PC, and uses more messages: for five
participants tolerating one failure, 17 against 12. Classic 2PC turns
out to be Paxos Commit with a single acceptor, which is a neat way to
see why it blocks.

The practical version of the same idea is to keep 2PC but make every
participant and the coordinator's state a replicated group, so no
single crash loses a vote or a decision. That's how Spanner does it,
and it has its own article:
[[distributed-transactions]].

## Doing it by hand in Postgres

PostgreSQL exposes the participant side of 2PC as SQL:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice';
PREPARE TRANSACTION 'transfer-42';   -- phase one: vote yes
-- later, from any session:
COMMIT PREPARED 'transfer-42';       -- or ROLLBACK PREPARED
```

After `PREPARE TRANSACTION`, the transaction is no longer tied to your
session. Its state is on disk and it survives a crash; any session can
later commit or roll it back by name. The prepared transaction still
holds its locks, and until it's resolved it holds back
[[vacuum|VACUUM]]. Left long enough, in extreme cases it can force the
database to shut down to avoid transaction ID wraparound. The
feature follows the X/Open XA model and is meant for an external
transaction manager, not for application code. If you don't run one,
the docs say to keep it off with `max_prepared_transactions = 0` so
nobody creates prepared transactions that get forgotten.

## Where it gets tricky

**2PC isn't 2PL.** [[two-phase-locking]] is about isolation inside one
database. Two-phase commit is about several machines agreeing on one
outcome. They're often used together, and share nothing but the name.

**Atomic commit is harder than consensus in one way.** Consensus only
needs a majority, so it can ride through crashed nodes. Atomic commit
needs every participant: if one crashes before voting, the transaction
has to abort. More participants means more chances to abort and more
machines whose slowness you wait for.

**The in-doubt state leaks into operations.** A prepared transaction
that nobody resolves is a production incident, not a theoretical
corner. It holds locks, blocks cleanup, and in Postgres shows up in
`pg_prepared_xacts`. Someone has to know which coordinator owns it.

**Is 2PC too expensive to use?** There's a real disagreement. Pat
Helland, who spent much of his career arguing for transactions, wrote
that large applications don't use distributed transactions because
they're too fragile and slow, and do [[sagas|workflow]] instead. Google's Spanner
team took the opposite view: offer transactions and let programmers fix
the bottlenecks when they appear, rather than always coding around the
lack of them. In Spanner's own tests, 2PC scaled reasonably to 50
participants and slowed noticeably at 100. Both are right about their
setting: 2PC across independent services owned by different teams is
fragile; 2PC inside one database built for it is routine.

**It only covers participants that speak it.** 2PC works across
databases that can prepare. An email or a call to another company's
API can't vote or roll back. That's why patterns like the
[[transactional-outbox]] and sagas exist.

## What this means when you build

- Inside a distributed database such as Spanner, 2PC is already
  there and made fault-tolerant. Use its transactions.
- Across your own services, avoid it. Each service would have to hold
  locks while waiting for your coordinator. Reach for [[sagas]] and an
  outbox.
- If you do run XA or `PREPARE TRANSACTION`, make the coordinator's log
  durable, monitor for prepared transactions older than a few seconds,
  and have a runbook for resolving them.
- Keep transactions that span machines short and few-participant. Every
  extra participant adds latency, lock time and another way to abort.

## Further reading

- [Consensus on Transaction Commit](https://lamport.azurewebsites.net/video/consensus-on-transaction-commit.pdf), Jim Gray and Leslie Lamport, 2006. The precise statement of the commit problem, 2PC's cost and blocking, and Paxos Commit.
- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge. Section 7.1: 2PC step by step, in-doubt transactions, and fault-tolerant 2PC over total order broadcast.
- [PREPARE TRANSACTION](https://www.postgresql.org/docs/current/sql-prepare-transaction.html), PostgreSQL Global Development Group, version 18. The participant side of 2PC in SQL, and why to leave it off without a transaction manager.
- [Two-Phase Transactions](https://www.postgresql.org/docs/current/two-phase.html), PostgreSQL Global Development Group, version 18. How Postgres follows X/Open XA and where prepared transactions are stored.
- [Spanner: Google's Globally-Distributed Database](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf), Corbett et al., 2012. Why Spanner kept 2PC, running it over Paxos, and how far it scaled.
- [Life beyond Distributed Transactions](https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf), Pat Helland, 2007. The case against distributed transactions in very large applications.
