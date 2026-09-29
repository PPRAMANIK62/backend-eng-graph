---
id: replication
title: Replication
depth: deep
phase: 11
note: >-
  Keeping copies on several machines, for availability, lower latency
  and more reads.
needs: [distributed-system]
leads_to: [leader-follower-replication, multi-leader-replication, leaderless-replication, consistency-models, chain-replication, disaster-recovery, multi-region]
compare_with: [partitioning, backups]
---

# Replication

Replication means keeping a copy of the same data on several machines
connected by a network. You do it so the data survives a machine dying,
so more machines can answer reads, and so a copy can sit close to the
users who read it. The copying is the easy part. Every write has to
reach every copy, and how you do that decides what your users see when
something goes wrong.

## Why keep more than one copy

Picture one Postgres server holding a `users` table for a web app. It
works until the disk dies, the machine reboots for a kernel update, or a
report query eats all its CPU. Every one of those is an outage, because
there's only one place the data lives. That's the single-machine
problem a [[distributed-system]] is meant to solve, and replication is
usually the first tool people reach for.

Copies buy you four things:

- **Staying up.** If one server is lost, another holds the same data
  and can take over.
- **More reads.** Reads can be spread over several copies. MySQL calls
  this scale-out: all writes go to one server, reads go to many.
- **Lower latency.** A copy in another data center or region puts the
  data near the users there.
- **Somewhere to do heavy work.** Analytics queries and backup jobs can
  run on a copy without slowing the server that takes the writes.

## Reads are easy, writes are the problem

If the data never changed, replication would be trivial: copy it once
to each server and send reads anywhere. Read-only servers are easy to
combine; servers that take a mix of reads and writes are much harder,
because a write that lands on one server has to reach all the others.

Say a user changes their email address. The `UPDATE` runs on one
machine. Until the other copies learn about it, they hold the old
address, and anyone reading from them sees it. Every replication design
is an answer to three questions about that one write:

1. **Which servers may accept it?** One, several, or any.
2. **When does the client hear "done"?** After one copy has it, or after
   several have it.
3. **What gets sent to the others?** The SQL statement, the changed
   rows, or the bytes of the storage engine's log.

## Who takes the writes: three shapes

The answer to the first question splits replication into three
families.

![Three diagrams side by side. Single leader: a client writes to one leader, which sends its changes to two followers. Multi-leader: two leaders each take writes from their own clients and send changes to each other, with a warning that the same row can change on both. Leaderless: a client sends the same write straight to three replicas and waits for some of them to answer.](img/replication-shapes.svg)

*The three ways to decide who accepts a write.*

- **Single leader.** One server takes all the writes and the others
  follow it. Postgres calls them primary and standby, MySQL source and
  replica, MongoDB primary and secondary. Only one server changes the
  data, so there's one order of writes and nothing to reconcile. It
  has its own article:
  [[leader-follower-replication]].
- **Multi-leader.** Several servers take writes, each on its own, and
  send their changes to the others. It suits sites that are far apart
  or not always connected. The price is conflicts: two leaders can
  change the same row at the same time, and something (a rule or a
  person) has to decide which change wins. See
  [[multi-leader-replication]].
- **Leaderless.** Any replica can take a write. Each write goes to
  several replicas and each read asks several replicas. With N copies,
  a write waits for W of them to confirm and a read asks R of them.
  If W + R is bigger than N, every read overlaps at least one copy that
  took the latest write. See [[leaderless-replication]] and
  [[quorums]].

The first family keeps a single copy's behaviour: at any time, one
server is in charge. The other two accept that copies can differ for a
while and have to be brought back together.

## When the client hears "done"

The second question is about waiting. The leader (or coordinator) can
reply to the client as soon as it has the write itself, or it can wait
until other copies confirm they have it too.

- **Synchronous:** the write isn't committed until the other servers
  have it. A failover then loses nothing, and every copy gives the same
  answer. But each write waits on the network and on the slowest server
  it has to hear from, and if a server it must wait for is down, writes
  stop. Over a slow network, a fully synchronous setup can cut
  performance by more than half.
- **Asynchronous:** the client hears "done" first and the copies catch
  up afterwards. Writes are fast and don't care if a follower is down.
  But a write that only one machine had is gone if that machine dies
  before passing it on, and a read from another copy can return
  slightly old data.

Databases let you choose. The trade-off, and the in-between options,
are in [[sync-vs-async-replication]].

With asynchronous copies you get what's called [[eventual-consistency]]:
stop writing, and the copies will agree after a while. The time in
which they can disagree is the inconsistency window. Reading from an
async replica is the everyday example: a Postgres read-only standby is
eventually consistent with its primary. What that does to users is [[replication-lag]]; the wider
menu of guarantees is [[consistency-models]].

## What gets copied

The third question is about the stream itself. There are three common
choices, from most readable to most exact:

- **Statements.** Send the SQL to every copy and run it again there.
  Anything non-deterministic breaks it: `random()`,
  `CURRENT_TIMESTAMP` and sequences can give each server a different
  value.
- **Rows.** Send what changed: this row now has these values.
- **The storage log.** Ship the database's own [[write-ahead-log]] and
  have the copy replay it. Postgres standbys work this way. It's exact,
  but it can only copy the whole server, never one table.

[[leader-follower-replication]] walks through each in more detail.

## Where it gets tricky

**A replica isn't a backup.** A replica copies every change, including
the bad ones. Drop a table on the primary and the drop is replayed on
every standby, which has no choice, because the change already
happened on the primary. Replicas protect you
from a lost machine, not from a bad command or a bug that writes
garbage. You still need [[backups]] for that. (A replica is a good place
to *take* a backup from, which is a different thing.)

**Replication isn't partitioning.** Every replica holds all the data.
If the data doesn't fit on one machine, or the writes are too many for
one leader, more replicas don't help. Splitting the data so each machine
holds a part is [[partitioning]].

**"Is the other server dead?" has no reliable answer.** A server that
stops answering might have crashed, or the network between you might
have failed while it carries on (a [[network-partitions|network
partition]]). From the outside you can't tell which.
If a follower is promoted because the leader looked dead, and the old
leader is in fact alive, you have two leaders taking writes. This is
split brain, and it's the hard part of [[failover]]. Even MongoDB's
documentation allows that a second node may briefly believe it's
primary too.

**Synchronous doesn't mean "never lose anything".** It means a
committed write is on more than one machine. If every copy dies, you
still lose it. What "has it" means (received, on disk, or applied) also
differs between databases; see [[sync-vs-async-replication]].

**More copies can mean less availability.** A write that must reach
every copy fails as soon as one copy is down. With N = 3 and every write
waiting for all 3, losing one node stops writes.

## What this means when you build

- Start with a single leader and asynchronous followers unless you have
  a reason not to. Know which writes you'd lose if the leader died right
  now, and decide if that's acceptable.
- If a write must survive the loss of a machine, make that write wait
  for at least one other copy, and find out what your database does
  when that copy is gone.
- Treat reads from replicas as possibly stale. Decide per query whether
  that's fine.
- Keep real backups, separate from replicas.
- Plan for failover before you need it: how a follower gets promoted,
  and how the old leader is stopped from taking writes.

## Further reading

- [Chapter 26. High Availability, Load Balancing, and Replication](https://www.postgresql.org/docs/current/high-availability.html), PostgreSQL Global Development Group, PostgreSQL 18. Why read/write servers are hard to combine, and synchronous vs asynchronous in a few paragraphs.
- [26.1. Comparison of Different Solutions](https://www.postgresql.org/docs/current/different-replication-solutions.html), PostgreSQL Global Development Group, PostgreSQL 18. A tour of every way to keep servers in step, from shared disks to multimaster, with a feature table.
- [26.4. Hot Standby](https://www.postgresql.org/docs/current/hot-standby.html), PostgreSQL Global Development Group, PostgreSQL 18. Reading from a standby, why it's eventually consistent, and why it must replay a DROP TABLE.
- [MySQL 8.4 Reference Manual, Chapter 19 Replication](https://dev.mysql.com/doc/refman/8.4/en/replication.html), Oracle. The four reasons MySQL gives for replicating.
- [Replication (MongoDB manual)](https://www.mongodb.com/docs/manual/replication/), MongoDB. Replica sets, the oplog, elections, and why copies help.
- [Eventually Consistent, Revisited](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html), Werner Vogels, 2008. What clients see when data is replicated, and N, W and R.
