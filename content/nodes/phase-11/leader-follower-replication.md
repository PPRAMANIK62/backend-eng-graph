---
id: leader-follower-replication
title: Leader-follower replication
depth: deep
phase: 11
note: >-
  One node takes writes and ships its log to the others.
needs: [replication, write-ahead-log]
leads_to: [sync-vs-async-replication, failover, raft]
compare_with: [leaderless-replication, logical-replication, failure-detection, consensus, replicated-state-machine]
---

# Leader-follower replication

In leader-follower replication one server, the leader, accepts every
write and records it in a log. The other servers, the followers, read
that log and apply the same changes in the same order, so they end up
with the same data. It's how Postgres, MySQL and MongoDB replicate by
default and how [[kafka-architecture|Kafka]] replicates each partition, so it's the kind of
[[replication]] you'll meet first.

## One server decides the order

The hard part of keeping copies in step is agreeing on the order of
writes. If two servers could each accept writes, they could apply them
in different orders and end up with different data. Leader-follower
sidesteps that: only the leader accepts writes, so the leader's order
is the order. A leader that picks the order is the simplest and fastest
way to build a replicated log. Followers don't decide anything; they
copy what the leader chose.

The names change between systems. Postgres says primary and standby,
MySQL says source and replica, MongoDB says primary and secondary, Kafka
says leader and follower. The shape is the same.

## Following one write

Take a Postgres primary with one standby, and an app that runs:

```sql
UPDATE accounts SET balance = balance - 50 WHERE id = 7;
```

1. **The leader writes its log.** The primary records the change in its
   [[write-ahead-log]] (WAL), writes a commit record, and flushes it,
   as it would with no replicas at all.
2. **The log is sent.** On the standby, a `walreceiver` process holds a
   connection to the primary, where a `walsender` process streams WAL
   records as they're produced. Nobody sends SQL.
3. **The follower stores it.** The standby writes the records to its
   own WAL on disk.
4. **The follower replays it.** The standby applies each record to its
   data files, exactly as it would during
   [[crash-recovery]]. A standby is a server in continuous recovery
   mode: a crash recovery that never ends.
5. **Reads on the follower see it.** Once the commit record is replayed,
   new queries on the standby see the new balance.

![A leader's log of eight records, numbered 1 to 8, all committed on the leader. An arrow labelled "stream" goes to follower A, whose log has records 1 to 7 received and records 1 to 6 replayed. A second arrow goes to follower B, which has received 1 to 4 and replayed 1 to 3. Reads on each follower see only what it has replayed.](img/leader-follower-replication-log.svg)

*Each follower is somewhere behind the leader, at two positions: what it has received, and what it has replayed. Reads see only the second.*

Every follower sits at some position in the leader's log, and that
position only moves forward. How far behind it is at any moment is
[[replication-lag]]. Whether step 3, or even step 5, has to happen
before the app hears "committed" is [[sync-vs-async-replication]]. By
default in Postgres, neither does: the client gets its answer after
step 1.

## Push or pull

In Postgres the standby opens the connection and the primary pushes WAL
down it as it's generated. Kafka turns this around: a follower fetches
from the leader just like a consumer would. Pulling has a nice side
effect: the follower can batch the entries it fetches and apply them
together. MongoDB secondaries also copy the
primary's log, which it calls the oplog, and apply it asynchronously.

Either way, the followers' logs end up identical to the leader's: the
same entries at the same positions (Kafka's offsets, Postgres's LSNs).

## What goes in the log

What the leader sends matters more than it looks.

- **Statements.** Send the SQL and let each follower run it again.
  Anything non-deterministic breaks this: `random()`, `CURRENT_TIMESTAMP`
  or a sequence can produce a different value on each server. MySQL
  calls this statement-based replication and notes trouble with stored
  routines and triggers.
- **Row changes.** Send the new values of each changed row. This is
  MySQL's default (row-based logging). The follower doesn't have to
  compute anything, so it can't compute it differently.
- **Physical log.** Send the storage engine's own log, the byte-level
  changes to pages. Postgres streaming replication does this. It's
  exact, but it copies the whole server (every database, every table),
  and the follower must run the same major Postgres version on the same
  hardware architecture, because it's replaying the leader's on-disk
  format.
- **Logical log.** Decode the physical log into row changes per table.
  Postgres [[logical-replication]] does this, which lets you replicate
  only some tables.

## Adding a follower

A new follower can't start from an empty disk and replay the log from
the very beginning; the leader threw most of that away long ago. So it
starts from a copy. In Postgres you take a base backup of the primary,
restore it on the new machine, mark it as a standby, and point it at the
primary. It then replays WAL forward from where the backup left off
until it has caught up.

That only works if the leader still has the WAL the follower needs. A
primary recycles old WAL segments, and if it recycles one before the
standby has read it, the standby is stuck and has to be rebuilt from a
fresh base backup. Postgres gives you three ways to prevent that: keep
extra WAL (`wal_keep_size`), keep an archive of WAL files the standby
can read, or create a **replication slot**, which makes the primary keep
every segment until that standby has received it.

Slots cut both ways. A standby that is down or far behind makes its slot
keep holding WAL, and the primary's disk can fill up.
`max_slot_wal_keep_size` caps how much a slot can hold.

A standby can also pass WAL on to other standbys, which is called
cascading replication. It saves connections to the primary and traffic
between sites, but in Postgres it's always asynchronous.

## When the leader dies

Followers exist so one of them can take over. Promoting one is a single
command in Postgres (`pg_ctl promote` or `pg_promote()`): the standby
stops recovery and starts accepting writes. The hard parts are deciding
that the leader is really dead ([[failure-detection]]), picking the follower with the most data,
stopping the old leader from coming back as a second leader, and
repointing clients. That's [[failover]].

Some systems automate it. A MongoDB replica set holds an election when
the primary has been silent for `electionTimeoutMillis`, 10 seconds by
default, and the median time to elect a new primary shouldn't normally
exceed 12 seconds. In Kafka a controller picks the
new leader for a partition from its [[in-sync-replicas]]. Doing this
election safely in general is what [[consensus]] algorithms like [[raft]]
are for.

## Where it gets tricky

**Followers are read-only, and not just by policy.** A Postgres hot
standby refuses every write, even to a temporary table. Anything that
needs to write, like `SELECT ... FOR UPDATE` or `nextval()`, fails
there. Code that sends "read-only" requests to a replica has to really
be read-only.

**Reads on a follower can fight the replay.** The follower has to apply
whatever the leader already did. If the leader drops a table that a
long report is reading on the follower, or [[vacuum]] removes row
versions that the report's snapshot still needs, the follower must
either pause replay or cancel the query. Postgres pauses for up to
`max_standby_streaming_delay`, then cancels. You can stop the vacuum
conflicts with `hot_standby_feedback`, but then the leader keeps dead
rows around for the follower's sake and its tables bloat. A follower
used for failover wants a short delay; a follower used for reports wants
a long one. It's hard to have both on one machine.

**The leader is still one machine for writes.** Followers add read
capacity and safety, not write capacity. Every write still goes through
one leader. Kafka gets around this by having many partitions, each with
its own leader, spread across brokers. That's [[partitioning]] on top of
replication.

**The replication stream is sensitive data.** It contains every change
to every table, so only trusted accounts should be able to read it.

**Physical replication doesn't cross major versions.** A byte-level
copy of one version's on-disk format can't be replayed by another, so
the leader and its physical followers have to be upgraded together.
For minor releases, the safe order is standbys first.

## What this means when you build

- Know which of the four log types your database ships. It decides what
  can differ between leader and follower, and whether you can upgrade
  with replicas in place.
- Watch disk space on the leader if you use replication slots, and drop
  slots for followers you've removed.
- Separate the follower you'd fail over to from the one that runs long
  reports, or accept that reports get cancelled.
- Treat promotion as a procedure, not a command: fencing the old leader
  and moving clients are part of it.

## Further reading

- [26.2. Log-Shipping Standby Servers](https://www.postgresql.org/docs/current/warm-standby.html), PostgreSQL Global Development Group, PostgreSQL 18. How a standby follows the primary's WAL, from base backup to streaming, slots and cascading.
- [26.1. Comparison of Different Solutions](https://www.postgresql.org/docs/current/different-replication-solutions.html), PostgreSQL Global Development Group, PostgreSQL 18. WAL shipping next to logical and statement-based replication, and why broadcasting statements breaks.
- [26.4. Hot Standby](https://www.postgresql.org/docs/current/hot-standby.html), PostgreSQL Global Development Group, PostgreSQL 18. What a read-only follower refuses, and the conflicts between its queries and replay.
- [MySQL 8.4, Replication Formats](https://dev.mysql.com/doc/refman/8.4/en/replication-formats.html), Oracle. Statement-based vs row-based vs mixed binary logging.
- [Replication (MongoDB manual)](https://www.mongodb.com/docs/manual/replication/), MongoDB. The oplog, asynchronous secondaries and elections.
- [Kafka design](https://kafka.apache.org/43/design/design/), Apache Kafka project, Kafka 4.3. The Replication section: followers that pull, identical logs, and why a single leader is the simplest replicated log.
