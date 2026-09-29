---
id: failover
title: Failover
depth: deep
phase: 11
note: >-
  Promoting a follower when the leader dies: split brain and lost
  writes.
needs: [leader-follower-replication]
leads_to: [multi-region, split-brain]
compare_with: [process-pauses, disaster-recovery]
---

# Failover

Failover is what happens when the leader of a replicated database dies
and a follower is promoted to take its place. The promotion itself is
one command. Everything around it is hard: deciding the leader is
really dead, picking the right follower, keeping the old leader from
coming back as a second leader, and accepting that some writes the old
leader confirmed may be gone.

## Five steps, each of which can go wrong

Take a Postgres primary with two standbys, using the default
asynchronous [[leader-follower-replication]]. The primary's machine
loses power. Here's what has to happen before the app can write again:

1. **Notice.** Something has to decide the primary is dead. All it can
   see is that the primary stopped answering. Redis Sentinel, for
   example, marks a server down on its own view when it gets no valid
   reply to its pings for a configured time. That's
   [[failure-detection]], and it can't tell dead from slow.
2. **Agree.** One watcher's opinion isn't enough, because that watcher
   might be the one that's cut off. Sentinel needs a configured number
   of Sentinels to agree the primary is down, and then a majority of
   all Sentinels to authorize one of them to run the failover. It never
   starts a failover from the minority side of a partition, and two
   Sentinels are never enough.
3. **Choose.** Pick the follower to promote. The one that received the
   most of the old leader's log loses the least. Sentinel ranks replicas
   by a configured priority first (lower wins), then by how much
   replication data they've processed.
4. **Promote.** On Postgres, `pg_ctl promote` or `pg_promote()`. The
   standby stops replaying and starts taking writes.
5. **Repoint and fence.** Clients have to find the new leader (a moved
   IP address, a config update, [[service-discovery]]). And the old
   leader, if it comes back, has to learn it's no longer the leader.

PostgreSQL does none of steps 1, 2, 3 or 5 for you. Its manual says it
doesn't include the software to detect a failed primary and tell the
standby, and leaves that to outside tools. Most of what can go wrong
with failover lives in those outside tools and in the gaps between the
steps.

## Asynchronous replication means lost writes

With asynchronous replication the leader confirms a write as soon as
it's durable locally, and ships it to followers after. So at the moment
it dies, it may hold writes that no follower has.

![Timeline with three lanes: client, old leader and follower. Writes w1 to w4 are replicated to the follower. The client sends w5, the old leader stores it and replies OK, then crashes before shipping w5. The follower is promoted with w1 to w4. When the old leader comes back and rejoins as a follower, w5 is discarded, or saved to a rollback file in MongoDB.](img/failover-lost-write.svg)

*A confirmed write that no follower had. The client was told OK; after failover the write is gone.*

The client was told "OK" for w5, and after failover w5 doesn't exist on
the new leader. When the old leader comes back, it holds a write that
conflicts with the new history, and something has to go.

Systems are unusually frank about this. The Redis Sentinel docs say
outright that Sentinel with Redis doesn't guarantee acknowledged writes
survive a failure, because Redis replicates asynchronously. MongoDB
calls it a rollback: when the old primary rejoins, it undoes the writes
the others never got and, by default, saves them to BSON files so a
person can look at them. It notes that rollbacks are often the result of a
network partition, and that followers that can't keep up make them
bigger.

The fix is to wait for followers before confirming. MongoDB's
`w: "majority"` write concern waits until a majority of the set has
the write, and with journaling on, a write acknowledged that way isn't
rolled back. It's been the default for most deployments since MongoDB
5.0. With `w: 1`,
only the primary has confirmed it. The costs of waiting are covered in
[[sync-vs-async-replication]], and how far behind followers run in
[[replication-lag]].

## Split brain: two leaders at once

The worse failure, called [[split-brain|split brain]], is when the old leader isn't dead at all. A
[[network-partitions|network partition]] cuts it off from the watchers,
they promote a follower, and now two servers both take writes.

![Three boxes, each running a Redis server and a Sentinel. A network partition cuts box 1, with the old primary M1 and client C1, off from boxes 2 and 3. On the majority side, the Sentinels promote R2 to primary. C1 keeps writing to M1. When the partition heals, M1 is turned into a replica of R2 and C1's writes are thrown away.](img/failover-split-brain.svg)

*The old primary keeps taking writes on the minority side. Adapted from Redis, "High availability with Redis Sentinel", example 2.*

Here the Sentinels on boxes 2 and 3 are a majority, so they promote R2.
Client C1, stuck on M1's side, keeps writing to M1. When the partition
heals, Sentinel turns M1 into a replica of R2, and M1 throws its data
away. Everything C1 wrote in the meantime is lost.

Sentinel gives you one lever. With `min-replicas-to-write 1` and
`min-replicas-max-lag 10`, a primary stops accepting writes when it
can't reach at least one replica, so the cut-off M1 stops accepting
writes after 10 seconds. That doesn't prevent loss. It puts a bound on the
window.

Without a majority rule it gets worse. The Sentinel docs walk through
a two-box setup: if either side could promote without a majority,
clients would write to both sides indefinitely, and when the partition
healed there'd be no way to know which configuration is right.

The general cure has two parts:

- **Agree before promoting,** with a majority, so only one side of a
  partition can do it. That's [[leader-election]], and doing it right
  is what [[consensus]] algorithms are for.
- **Fence the old leader,** so that even if it's still running it can't
  act. The Postgres manual calls this STONITH (shoot the other node in
  the head), and says that without it both machines think they're
  primary, which leads to confusion and in the end data loss. A softer
  way is a number that only goes up. Each Sentinel failover gets a
  unique configuration epoch, and a higher epoch always wins over a
  lower one. A number that only goes up is also the idea behind
  [[fencing-tokens]].

## Two real failovers at GitHub

**2012: failovers nobody wanted.** GitHub ran a three-node MySQL
cluster with automatic failover through Pacemaker. A schema migration
put enough load on the primary that its [[health-checks]] failed, so the
cluster manager promoted another node. That node had a cold InnoDB
[[buffer-pool]], ran slowly, failed its own health checks, and the role
failed back. The engineer on it turned all health checks off with
Pacemaker's maintenance mode. The next morning, a crash in the cluster
manager split the cluster in two. The
configuration required a majority, yet both sides ran a leader election
without proper coordination, and the lone node, one already known to be
out of date, became primary. Engineers powered it off seven minutes
later, which took down all database access.

The damage wasn't only in MySQL. Redis stored data keyed by IDs that
MySQL generated, and records created in the window got out of sync
between the two stores. Some users saw events on other users'
dashboards, and 16 private repositories were briefly visible to people
outside them. GitHub's conclusion was that nobody on the team would
have approved any of these failovers, and it made failover of its main
database manual.

**2018: a correct failover to the wrong place.** A 43-second network
cut between GitHub's East Coast hub and its main East Coast data center
started it. Its failover tool, Orchestrator, runs on Raft, and the
nodes on the West Coast and in the cloud formed a quorum and promoted
West Coast MySQL primaries. The consensus part worked as designed. But
the East Coast primaries had a few seconds of writes that hadn't
reached the West, and the West then took new writes, so each side had
writes the other lacked. On one of the busiest clusters that was 954
writes. Failing back wasn't safe, and the apps in the East couldn't cope
with a cross-country round trip on most database calls.

GitHub chose to keep the data consistent at the cost of a slow site,
restored from [[backups]] (that alone took hours for multiple terabytes),
waited for replicas to catch up, and kept the stranded writes from
MySQL's binary logs to reconcile afterwards, some of them by hand.
It was degraded for 24 hours and 11 minutes. Orchestrator did
exactly what it was configured to do. The fix was to stop it promoting
primaries across regions.

## After the failover

Once a standby is promoted you have one server and no spare. The
Postgres manual calls this a degenerate state. To get back to normal you
rebuild a standby, either from the old primary once it's back (the
`pg_rewind` tool speeds this up on large clusters) or on a new machine.

The manual also recommends switching roles on purpose from time to
time. It gives each machine a maintenance window, and it tests the
failover path so you find out it works before you need it.

## Where it gets tricky

**Automatic or manual.** Automatic failover shortens outages when the
leader really dies. It also acts on false alarms: GitHub's 2012
failovers were triggered by load, not death, and each one made things
worse (a cold cache on the new primary, then a flip back). Manual
failover is slower but has a person checking. Neither is right for
every system, and the choice should be written down.

**A detection timeout has no safe value.** Short [[timeouts]] fail over on
a slow leader. Long ones leave you without writes for longer when it's
really dead. [[process-pauses]] make this worse: a leader frozen for a
few seconds looks dead, then wakes up still thinking it's the leader.

**Consensus doesn't save the data.** Running the failover decision on
Raft, as Orchestrator does, means only one side of a partition gets to
promote. It doesn't make asynchronous replication stop losing writes.
The 2018 incident had a correct election and still ended with writes
on both sides.

**"Quorum" means different things.** In Sentinel, the configured quorum
is only how many Sentinels must agree the primary is down. Actually
running a failover needs a majority of all Sentinels. Mixing the two up
leads to setups that can't fail over, or that fail over too easily.

**Failover can cross a boundary you didn't plan for.** Promoting the
most up-to-date replica is right for the data and can be wrong for
everything else. In 2018 it put the database a continent away from the
application. Where a promoted leader is allowed to live is part of
[[multi-region]] design.

**Other systems remember the database's IDs.** If another store keeps
IDs that the database generated, a failover that loses or rewrites
recent writes can leave those references out of sync with the
database. That's how GitHub's 2012 failover ended up showing events to
the wrong users.

## What this means when you build

- Decide how many confirmed writes you can lose on failover. If the
  answer is none, confirm writes only after a majority has them
  (`w: "majority"` in MongoDB, or
  [[sync-vs-async-replication|synchronous replication]]).
- Put the failover decision behind a majority of independent watchers,
  never a single one and never two.
- Fence the old leader: STONITH, a lease, or a number that only goes up
  and that storage checks.
- Bound the damage on the cut-off side: stop taking writes when you
  can't reach any follower (Redis `min-replicas-to-write`).
- Rehearse with planned switchovers, and test failover under a
  partition, not just a clean shutdown.
- Keep a way to find the writes that were lost: MongoDB's rollback
  files, MySQL binary logs, whatever your system has.

## Further reading

- [26.3. Failover](https://www.postgresql.org/docs/current/warm-standby-failover.html), PostgreSQL documentation, version 18. STONITH, what Postgres leaves to outside tools, and the degenerate state after failover.
- [High availability with Redis Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/), Redis docs. A complete failover system spelled out: detection, majority authorization, replica choice, configuration epochs, and the writes it can lose.
- [Rollbacks During Replica Set Failover](https://www.mongodb.com/docs/manual/core/replica-set-rollbacks/), MongoDB manual, version 8.0. What happens to an old primary's unreplicated writes, and how majority write concern prevents it.
- [GitHub availability this week](https://github.blog/news-insights/the-library/github-availability-this-week/), Jesse Newland, GitHub, 2012. Automatic failover triggered by load, a split cluster, a stale node promoted, and the decision to go manual.
- [Post-incident analysis of GitHub's 2018 MySQL failover](https://github.blog/news-insights/company-news/oct21-post-incident-analysis/), Jason Warner, GitHub, 2018. A Raft-based failover tool promoting across the country after a 43-second partition, and the day it took to recover.
