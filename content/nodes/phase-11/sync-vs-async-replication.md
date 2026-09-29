---
id: sync-vs-async-replication
title: Synchronous vs asynchronous replication
depth: short
phase: 11
note: >-
  Wait for followers before confirming, or don't, and what each loses.
  Semi-sync in between.
needs: [leader-follower-replication]
leads_to: [in-sync-replicas, replication-lag, pacelc, multi-region]
compare_with: [quorums]
---

# Synchronous vs asynchronous replication

When a leader commits a write, it can tell the client "done" right away
and send the change to its followers afterwards (asynchronous), or it
can wait until at least one follower confirms it has the change
(synchronous). The first is fast and can lose recent writes if the
leader dies. The second survives the leader's death but makes every
commit wait on the network, and on a follower that might be down.
Semi-synchronous replication sits in between.

## One commit, two timelines

Take [[leader-follower-replication]] with one leader, one follower and a
client that commits an order.

![Two sequence diagrams side by side. Asynchronous: the client sends a commit to the leader, the leader flushes its log and answers OK at once, and only afterwards sends the change to the follower; if the leader crashes before sending, the committed order exists nowhere else. Synchronous: the client sends the commit, the leader flushes its log, sends the change to the follower, waits for the follower's acknowledgment, and only then answers OK; the extra wait is one round trip between leader and follower.](img/sync-vs-async-replication-timeline.svg)

*The same commit with and without waiting for a follower.*

**Asynchronous.** The leader writes the commit to its own log, answers
the client, then ships the change. If the leader crashes between the
answer and the shipping, the order is committed on a machine that's now
down and missing everywhere else. Promote the follower and the order is
gone. How much you lose is proportional to how far behind the follower
was at the moment of failover.

**Synchronous.** The leader writes the commit to its own log, sends it,
and waits for the follower to confirm before answering. Now a committed
order is on two machines, and the only way to lose it is to lose both at
once. The cost is at least one network [[network-latency|round trip]] on every commit, plus
the follower's time to confirm: cheap within one data center, expensive
between regions. Postgres streaming replication is asynchronous unless
you ask for more.

## What "confirm" means

"Wait for the follower" hides a choice about how far the follower has
to get. Postgres makes the choice explicit with `synchronous_commit`,
when a synchronous standby is configured:

- **`remote_write`**: the standby has received the commit and handed it
  to its operating system, but not flushed it. A Postgres crash on the
  standby is fine; an OS crash or power cut there can still lose it.
- **`on`**: the standby has flushed it to disk. This is the normal
  meaning of synchronous replication in Postgres.
- **`remote_apply`**: the standby has also replayed it, so queries on
  the standby already see it. Only this level makes reads on the
  standby fresh.

Postgres also lets you set this per transaction. Picture a workload
where 10% of changes are customer details and 90% are chat messages:
make the important ones wait, and let the rest go async.

## Semi-synchronous

MySQL's semi-synchronous replication waits until at least one replica
has received the transaction and written it to its relay log on disk.
It doesn't wait for the replica to apply it. By default the wait happens
after the source syncs its binary log and before it commits to the
storage engine. In return MySQL promises that every transaction it has
committed has reached at least one replica.

Two details change what that promise is worth:

- **On timeout it goes back to async.** If no replica acknowledges in
  time, the source carries on without waiting, and returns to
  semi-synchronous once a replica catches up. So the guarantee
  disappears exactly when replicas are slow or unreachable, which is
  when you'd want it.
- **The failed source must be thrown away.** After a crash and failover,
  the old source may hold transactions no replica acknowledged, so it
  has to be discarded, not reused as a source.

## Where it gets tricky

**A synchronous follower that's down stops all commits.** In Postgres,
commits wait for the named synchronous standbys, and if one crashes they
may never complete. The fix is to list more candidates than you need.
`synchronous_standby_names = 'FIRST 1 (s1, s2)'` waits for the
highest-priority standby that's connected, and `ANY 2 (s1, s2, s3)`
waits for any two of three (a small [[quorums|quorum]]). MySQL takes the
other road and falls back to async. Neither is free: one gives up
availability, the other gives up the durability you asked for.

**"Not acknowledged" doesn't mean "not committed".** If the Postgres
primary crashes while commits are waiting and then restarts, those
transactions are marked committed during recovery, even if no standby
got them. The promise is narrower than it sounds: the client won't hear
"committed" until the standbys have it. A client that timed out can't
assume its write failed.

**Waiting holds locks.** A waiting commit keeps its [[explicit-locking|locks]] until the
follower confirms, so other transactions wait too.

**Synchronous replication doesn't fix stale reads.** With `on`, the
standby has the change on disk but may not have replayed it yet. Reads
there can still be behind; that's [[replication-lag]]. Only
`remote_apply` closes that gap.

## What this means when you build

- Decide which writes you can afford to lose if the leader dies. Make
  those async and the rest synchronous, per transaction if your
  database allows it.
- Put synchronous followers close to the leader. Every commit pays the
  round trip.
- Configure more synchronous candidates than you need, or know that
  your database will fall back to async, and alert when it does.
- Treat a timed-out commit as unknown, not failed.

## Further reading

- [26.2. Log-Shipping Standby Servers](https://www.postgresql.org/docs/current/warm-standby.html), PostgreSQL Global Development Group, PostgreSQL 18. Section 26.2.8: synchronous replication, the `synchronous_commit` levels, FIRST and ANY, and planning for failures.
- [MySQL 8.4, Semisynchronous Replication](https://dev.mysql.com/doc/refman/8.4/en/replication-semisync.html), Oracle. Async, semisync and fully synchronous compared, the wait point, and the fallback to async.
