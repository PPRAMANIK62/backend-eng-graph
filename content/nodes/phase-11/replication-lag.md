---
id: replication-lag
title: Replication lag
depth: deep
phase: 11
note: >-
  Followers behind the leader: read-your-writes and monotonic reads.
needs: [sync-vs-async-replication]
leads_to: [session-guarantees]
compare_with: [consumer-lag, causal-consistency, new-enemy-problem]
---

# Replication lag

With asynchronous replication, a follower applies the leader's changes a
little after the leader commits them. That delay is replication lag. It
is usually well under a second, and it can grow far past that under
load. If you send reads to followers, users will notice: a change
they just saved isn't there, or a comment they just saw vanishes on
refresh. Two [[session-guarantees|session guarantees]], read-your-writes and monotonic reads, name
exactly what goes wrong, and each has a handful of standard fixes.

## Where the delay comes from

In [[leader-follower-replication]], each follower is at some position in
the leader's log. With [[sync-vs-async-replication|asynchronous
replication]], the leader doesn't wait for that position to catch up
before telling the client "committed". The lag is the distance between
the leader's position and the follower's, in bytes of log or in time.

In a healthy setup it's small. Postgres streaming replication is
typically under one second behind, if the standby can keep up with the
load. GitHub, which serves reads from asynchronous MySQL
replicas, expects sub-second lag and takes a replica out of the serving
pool once it's a few seconds behind.

It grows when something in the pipeline can't keep up:

- **The leader is busy** producing log faster than it can send it.
- **The network** between them is slow or congested.
- **The follower is busy**: it has to write and replay every change the
  leader made while also serving reads.
- **Big writes.** One statement that touches 100,000 rows is one
  statement on the leader, and a long stretch of work on the follower.
  Everything behind it in the log waits. By the time it's done, the
  follower is behind on everything else too.
- **Reads blocking replay.** A long query on a Postgres standby can
  force it to pause replay rather than cancel the query (see
  [[leader-follower-replication]]). While replay is paused, nobody on
  that standby sees new changes.

## Two things users notice

![Two timelines. Read your own writes: a user saves a new display name on the leader; the follower hasn't applied it yet; the user's next page load reads from the follower and shows the old name. Monotonic reads: a user loads a page from follower A, which is caught up and shows a new comment; the next load goes to follower B, which is further behind, and the comment disappears.](img/replication-lag-anomalies.svg)

*The two anomalies lag causes for one user, each from reading a follower that's behind.*

**Your own write is missing.** A user changes their display name. The
write goes to the leader. The next page load reads from a follower that
hasn't applied it yet, and shows the old name. The user assumes the save
failed and tries again. The guarantee that rules this out is **read your
writes**: a read in a session sees every write that session made
earlier. The paper that named it, from Xerox PARC's Bayou project in
1994, opens with a real case from an older system called Grapevine: a
user changes their password, then gets "invalid password" when logging
in with the new one, because the login check hit a server the change
hadn't reached.

**Time goes backwards.** A user loads a page from follower A, which is
caught up, and sees a new comment. They refresh, the [[load-balancing|load balancer]] sends
them to follower B, which is further behind, and the comment is gone.
Refresh again and it's back. The guarantee that rules this out is
**monotonic reads**: once a session has seen some data, later reads in
that session never see an older state. The 1994 paper's example is a
calendar where meetings "come and go" as the app reads from different
copies.

The same paper defines two more guarantees about writes (writes follow
reads, and monotonic writes). MongoDB calls the four together its causal
consistency guarantees; the wider idea is [[causal-consistency]].

## Measuring it

You can't fix lag you can't see. Two ways to measure it:

**Log positions.** In Postgres, compare the primary's current WAL
position with what the standby has received and replayed. The gaps tell
you where the delay is. A gap between the primary's position and what
it has sent points at the primary. A gap between sent and received
points at the network or a loaded standby. A gap between received and
replayed means the standby gets WAL faster than it can apply it. The
`pg_stat_replication` view also turns this into time: `write_lag`,
`flush_lag` and `replay_lag` for each standby. For an async standby,
`replay_lag` is roughly how long a new commit takes to become visible
there.

**A heartbeat row.** Write the current time into a table on the leader
every so often, and on each follower subtract the replicated timestamp
from the current time. GitHub used Percona's `pt-heartbeat`, which
writes one every 100 ms. Because the timestamp only shows up once it's
replayed, this measures what a reader on that follower would see.

Measure the lag users see, which is replay, not receipt. A follower can
have the log on disk and still not show it to queries.

## Fixing read-your-writes

All the fixes come down to one idea: don't read from a follower that
might not have this user's write yet.

- **Read from the leader after a write.** For some time after a user
  writes, send their reads to the leader. GitHub did this for years with
  a five-second window: reads went to replicas only if the user's last
  write was more than five seconds ago. The reasoning: if a replica is
  more than five seconds behind, there are worse problems than a stale
  page. The cost is extra load on the one machine that also takes all
  writes.
- **Compare the lag with the time since the write.** A smarter version
  of the same idea. GitHub's `freno` service knows the current maximum
  lag across the cluster; if that's less than the time since the user's
  last write, the replicas already have it and the read can go there.
  This moved about 30% of the reads that used to go to the primary back
  to replicas.
- **Remember a position, not a time.** When the user writes, record the
  leader's log position for that write (in their session or a cookie).
  Only read from a follower whose replayed position is at or past it; if
  none is, wait or use the leader. This is exact, and it's what the 1994
  paper does: the client keeps the IDs of its writes and checks that a
  server has them before reading there. MongoDB offers it built in, as
  causally consistent client sessions.
- **Wait for the write to replicate.** For background work you can just
  wait. GitHub's indexing jobs record when the triggering write happened
  and hold off until the lag says the data has replicated, under 600 ms
  for 95% of jobs.
- **Make the write wait instead.** Postgres's
  `synchronous_commit = remote_apply` makes each commit wait until the
  synchronous standbys have replayed it, so a read there right after
  will see it. You move the delay from the reader to the writer.

## Fixing monotonic reads

- **Stick each user to one replica.** Choose the replica by a hash of
  the user ID, or keep the same one for the whole session. A single
  replica only moves forward, so the user never sees time go backwards.
  If that replica fails, you have to move the user, and the new replica
  has to be checked against what the session already saw.
- **Track the highest position seen.** The client keeps the latest log
  position (or version) it has read, and ignores or retries answers from
  anything older. This is the read-side twin of the position trick
  above.

## Keeping the lag small

Fixes for anomalies only matter if lag stays small most of the time. The
habits that keep it there:

- **Split big writes.** GitHub never updates 100,000 rows in one
  statement. It works in chunks of 50 to 100 rows and checks replica lag
  between chunks, pausing while it's too high. Migrations and [[backfills]]
  built this way can't swamp the replicas (see [[online-schema-change]]).
- **Take lagging replicas out of rotation.** GitHub's automation does
  this after a few seconds of lag.
- **Keep long queries off the failover standby.** In Postgres, a short
  `max_standby_streaming_delay` on the standby you'd promote keeps it
  close to the primary; long reports go to a separate one.

## Where it gets tricky

**These guarantees are per session.** Read-your-writes promises you see
*your* writes. It says nothing about someone else's. After you post a
comment, you'll see it, but a friend on another replica may not yet. If
the session ends, a new one starts with no guarantee from the old one.
And "session" is whatever you make it: the same user on a phone and a
laptop is two sessions unless you pass the position between them.

**Guarantees cost availability.** To keep a promise, you may have to
refuse to read from some replicas. If none is caught up enough, you
wait, fall back to the leader, or fail. Asking for a guarantee can
reduce availability, which is why the 1994 design lets each session
choose.

**Lag isn't one number.** It can be bytes of log or seconds, measured to
receipt, flush or replay. Time-based lag also needs writes to measure:
when a Postgres standby has caught up and no WAL is flowing, the lag
columns go NULL after a short while. A heartbeat row avoids that, since
it keeps writing.

**Failover turns lag into loss.** If the leader dies, whatever the
promoted follower hadn't received is lost, and users who read those
writes before will see them disappear. That's [[failover]]'s problem,
but its size is the lag at that moment.

**Synchronous replication doesn't mean fresh reads.** A Postgres
synchronous standby with the default `on` has flushed your commit to
disk but may not have replayed it. Only `remote_apply` makes reads there
see it.

**Not the same as consumer lag.** [[consumer-lag]] is how far a
message consumer is behind the log it reads. Replication lag is how far
a replica is behind its leader. Similar words, different problems.

**MongoDB's fine print.** Its causally consistent sessions give all four
guarantees only when reads use "majority" read concern and writes use
"majority" write concern. With weaker settings, during a failover when
two nodes briefly think they're primary, some guarantees quietly don't
hold.

## What this means when you build

- Decide, per endpoint, whether a stale read is acceptable. Most are;
  the page right after a user's own write usually isn't.
- Implement read-your-writes on purpose: leader reads for a short
  window, or better, a stored log position per session.
- Pin sessions to replicas if flicker would confuse users.
- Measure replay lag with a heartbeat and alert on it. Remove replicas
  that fall far behind.
- Chunk and throttle big writes, and schedule them with the replicas in
  mind.

## Further reading

- [Session Guarantees for Weakly Consistent Replicated Data](https://www.cs.cornell.edu/courses/cs734/2000FA/cached%20papers/SessionGuaranteesPDIS_1.html), Douglas Terry and others, Xerox PARC, PDIS 1994. Where read-your-writes and monotonic reads were named and defined, with the Grapevine and calendar examples and how to implement them.
- [26.2. Log-Shipping Standby Servers](https://www.postgresql.org/docs/current/warm-standby.html), PostgreSQL Global Development Group, PostgreSQL 18. Typical lag, measuring it with WAL positions, and `remote_apply`.
- [26.4. Hot Standby](https://www.postgresql.org/docs/current/hot-standby.html), PostgreSQL Global Development Group, PostgreSQL 18. Why a standby is eventually consistent, and how its own queries can hold back replay.
- [27.2 The Cumulative Statistics System](https://www.postgresql.org/docs/current/monitoring-stats.html), PostgreSQL Global Development Group, PostgreSQL 18. The `write_lag`, `flush_lag` and `replay_lag` columns of `pg_stat_replication`.
- [Mitigating replication lag and reducing read load with freno](https://github.blog/engineering/infrastructure/mitigating-replication-lag-and-reducing-read-load-with-freno/), Shlomi Noach and Miguel Fernández, GitHub, 2017. Lag in production: throttling big writes, heartbeat measurement, and routing reads after writes.
- [Causal Consistency and Read and Write Concerns](https://www.mongodb.com/docs/manual/core/causal-consistency-read-write-concerns/), MongoDB. A database that offers the session guarantees built in, and the settings they need.
