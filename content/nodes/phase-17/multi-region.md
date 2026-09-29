---
id: multi-region
title: Multi-region systems
depth: deep
phase: 17
note: >-
  Active-passive vs active-active across regions, and where the data
  lives.
needs: [replication, failover, sync-vs-async-replication, disaster-recovery]
leads_to: []
compare_with: [cell-based-architecture]
---

# Multi-region systems

A multi-region system runs in more than one geographic region, so that
losing a whole region doesn't take it down, users are served from
nearby, or data stays inside the country it must stay in. The servers
are the easy part: you can run copies anywhere. The hard part is the
data, because regions are far apart and every copy of the data has to
cross that distance. Almost every design choice comes down to which
region may write which data, and what happens to writes in flight when
a region fails.

## A region is a failure boundary

On AWS, a region is a group of Availability Zones in one geographic
area, and each zone is one or more separate data centers. Regions are
kept apart on purpose, so a failure in one stays in that region. Data
you store in one region doesn't exist in any other unless you copy it
there. That isolation is the whole point: a second region is only
useful if it doesn't share fate with the first (see
[[failure-domains]]).

There are three usual reasons to use more than one:

- **A bounded recovery time.** At 99.99% availability you can afford
  about 53 minutes of downtime a year. Detecting a failure can take at least 5
  minutes and getting an operator engaged another 10, and 30 to 45
  minutes to recover from one issue isn't unusual. If you can't wait for
  a broken region to be fixed, you need somewhere else to fail over to.
  (The arithmetic is in [[availability-math]].)
- **Data sovereignty.** Laws may require some data to stay in a
  jurisdiction.
- **Latency.** Users far from your only region pay a long round trip on
  every request.

AWS's own advice is to start with one
region and several zones. Most workloads meet their goals that way. A
multi-region setup typically costs about twice as much, and one built
badly can end up less available than the single region it replaced.

## Where the data lives decides the rest

Every region that holds a copy of your data has to get changes from
the region where they were made, over a long distance. That forces a
choice between the two kinds of [[replication]]:

- **Asynchronous.** A write commits in its own region and is copied
  later. Writes stay fast. But when that region fails, there will very
  likely be recent writes that never left it. They're unavailable until
  the region comes back, and someone has to reconcile them afterward.
  That reconciliation is business logic you write, not something the
  database does for you.
- **Synchronous.** A write commits only once another region has it. No
  acknowledged write is lost, but write latency goes up by an order of
  magnitude, and you usually need three regions so a majority of two
  can still commit when one is down (see [[quorums]]). Higher latency
  isn't something you can bolt onto an app later; its timeouts and
  retries were built around fast writes.

[[sync-vs-async-replication]] covers this choice inside one cluster.
Across regions the delays are bigger, and a partition between regions
is something you plan for, not a rare accident, so you're choosing
between consistency and availability from the start
([[cap-theorem]]).

Google's Spanner (2012) makes the trade-off explicit. An application
says which data centers hold which data, how far the data is from its
users (read latency), how far the replicas are from each other (write
latency) and how many replicas there are (durability). Its first big
user, the F1 ads backend, kept five replicas across the US, two on the
west coast and three on the east. Most applications, the paper
expected, would keep three to five data centers in one geographic
region instead.

## Active-passive: one region writes

The simplest design gives one region all the traffic and keeps a
standby in another, fed by asynchronous replication. When the primary
fails, you [[failover|fail over]]: promote the standby's data, and move
traffic to it, commonly by changing [[dns|DNS]].

![Three panels. Active-passive: Region A takes all reads and writes and copies asynchronously to Region B, a standby; on failure DNS moves traffic to B, and writes not yet copied are missing. Read local, write global: Region A takes reads and all writes and copies asynchronously to Region B, which serves local reads; users near B read from B but write to A, and their reads can be stale. Active-active: both regions take reads and writes and copy to each other; with asynchronous copying concurrent writes conflict, with synchronous copying every write waits on a quorum.](img/multi-region-patterns.svg)

*Three ways to split the work between two regions.*

Failing over a whole region goes wrong in ways a single database
failover doesn't:

- **The failover tool depends on the dead region.** If the control
  plane of your DNS service lives in the region you're failing away
  from, you may not be able to change DNS at all. Failover controls
  must work with no help from the primary.
- **Half a request path in each region.** If only some of your services
  fail over, the rest make calls across regions, slow enough to hit
  client timeouts. Fail over everything a user journey needs, together,
  and don't make cross-region calls in normal operation either.
- **Shared configuration.** Certificates, keys and secrets should be
  per region, with staggered expiry dates, so one expiring certificate
  can't break both regions at once.

A variant is **read local, write global**: every region serves reads
from its own replica, and all writes go to one primary region. Aurora
global databases work this way, with one writing region and up to five
read-only ones. Reads are fast everywhere, but a user who writes and
then reads in another region can see stale data, so the app has to
live with [[replication-lag]].

## Active-active: every region writes

In an active-active design, every region takes writes. It sounds like
the natural end state, and it's the most demanding one. The app has to
route users to a region, keep a user's session there, make every
transaction [[idempotency|idempotent]] so a retry in another region is
harmless, and handle conflicting writes. That's
[[multi-leader-replication]] at the scale of regions.

DynamoDB global tables show both ways to handle the conflicts:

- **Eventual mode (the default).** Each region's replica accepts writes
  and copies them to the others asynchronously, typically within a
  second. If two regions change the same item at once, the write with
  the latest internal timestamp wins, per item, and the other is gone
  ([[conflict-resolution]]). A conditional write checks only the local
  copy, and a transaction is atomic only in the region that ran it. If
  a region fails, you lose whatever hadn't been copied yet, usually a
  few seconds.
- **Strong mode.** A write is copied synchronously to at least one other
  region before it returns. It needs exactly three regions (or two plus
  a witness). A write to an item that another region is modifying at
  the same moment fails with an error you can retry, instead of being
  silently overwritten. Writes and strongly consistent reads pay for
  the cross-region round trip.

Most workloads that go multi-region for resilience don't need
active-active at all.

## Splitting users between regions

There's a middle path: give different data different home regions.
Assign half your customers to region one and half to region two, each
with its own primary and a standby elsewhere. A region failure then
hits only its share of users. It's [[cell-based-architecture]] with
regions as the cells.

Some databases do this per row. CockroachDB lets a table be:

- **Regional**, homed in one region: fast there, slower from elsewhere.
- **Regional by row**, where each row has its own home region. A users
  table can keep each user's row near that user.
- **Global**, readable quickly from every region, with slower writes
  because each write has to reach every region. Good for read-mostly
  reference data.

Spanner can do the same per user: one user's data with three replicas
in Europe, another's with five in North America.

## Where it gets tricky

**More regions can mean less availability.** A multi-region setup
built badly can be less available than one region. The usual cause is
hidden shared fate: if the pieces that must survive a region failure
depend on that region (its DNS control plane, a service only deployed
there, a shared certificate), the second region buys nothing.

**Replication costs real money.** Figma wanted its document journal
copied to another region, but found DynamoDB global tables would make
that feature six times as expensive. It met its 30-minute cross-region
goal instead by making sure every change was in a checkpoint file
within 30 minutes and relying on S3's cross-region copies of those
files. Not every piece of data needs the same recovery point.

**Untested failover isn't failover.** A recovery plan you've never run
doesn't count as one. The strongest version is to make switching
regions part of normal operation, and to watch the primary from the
standby region, since the primary's own monitoring may fail with it.
[[disaster-recovery]] covers drills and the RPO and RTO targets.

**Deploys are a shared risk.** Deploy to one region at a time, the
same way AWS staggers its own deploys across zones, so one bad release
can't break every region at once.

## What this means when you build

- Check that one region with several zones really can't meet your
  goals before paying for more.
- Decide per kind of data: which region writes it, whether it's copied
  synchronously or asynchronously, and what a failover may lose.
- Default to active-passive or users split across regions. Go
  active-active only if you can handle conflicts and idempotency
  everywhere.
- Keep each region self-contained: no cross-region calls, per-region
  secrets, failover controls that don't need the failed region.
- Rehearse failover and failback regularly.

## Further reading

- [AWS multi-Region fundamentals](https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/aws-multi-region-fundamentals/aws-multi-region-fundamentals.pdf), John Formento, AWS Prescriptive Guidance. When to go multi-region, the data choices, active-active costs, dependencies, failover and testing.
- [AWS Fault Isolation Boundaries](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html), Michael Haken, AWS, 2022. What Availability Zones and Regions are, and how they're kept apart.
- [How DynamoDB global tables work](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html), AWS docs. Multi-region writes in two modes: last writer wins asynchronously, or synchronous across three regions with conflicts rejected.
- [Spanner: Google's Globally-Distributed Database](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf), James C. Corbett et al., OSDI 2012. Choosing replica placement to trade read latency, write latency and durability, with F1's layout.
- [Table Localities](https://www.cockroachlabs.com/docs/stable/table-localities), Cockroach Labs, CockroachDB v26.3 docs. Regional, regional-by-row and global tables: giving each row a home region.
- [Making multiplayer more reliable](https://www.figma.com/blog/making-multiplayer-more-reliable/), Darren Tsung, Figma, 2022. A real cross-region replication decision, made on cost.
