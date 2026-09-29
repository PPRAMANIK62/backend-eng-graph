---
id: tombstones
title: Tombstones
depth: short
phase: 11
note: >-
  Marking a key as deleted instead of removing it, so a replica that
  missed the delete can't bring it back.
needs: [leaderless-replication]
leads_to: []
compare_with: [compaction]
---

# Tombstones

A tombstone is a marker that says "this key was deleted". Stores built
on [[leaderless-replication]] write one instead of removing the data, because in a system
where replicas catch up with each other, a key that simply disappears
from one replica looks exactly like a key that replica never received.
The next repair would copy the "missing" value back, and your deleted
row would return. Cassandra calls those returning rows zombies.

## Deleting by writing

Take three replicas that all hold a value A. You delete A, but one
replica is down at the time.

**Without tombstones**, the two live replicas just remove A:

- before: `[A]  [A]  [A]`
- after the delete: `[ ]  [ ]  [A]`

When [[anti-entropy]] compares the replicas, it sees one copy of A and
two gaps, and fills the gaps: `[A]  [A]  [A]`. The delete is undone.

**With tombstones**, the delete is written as a new, time-stamped entry
that travels through the normal write path like any other write:

- after the delete: `[A, tomb(A)]  [A, tomb(A)]  [A]`
- after repair: `[A, tomb(A)]  [A, tomb(A)]  [A, tomb(A)]`

Now repair copies the tombstone to the replica that missed it, and reads
ignore any value older than the tombstone. The 1987 Xerox paper that
named anti-entropy solved this problem the same way and called the
markers death certificates.

Cassandra also turns data with a time to live (TTL) into tombstones when
it expires, so TTLs have the same costs as deletes.

## Tombstones can't live forever

If every delete left a marker forever, deletes would slowly fill the
disk. So tombstones expire. In Cassandra each table has a grace period,
`gc_grace_seconds`, ten days by default. After it passes, the tombstone
may be removed, but only when [[compaction]] runs, and only if that
compaction also covers the files holding the older data it deletes,
since a tombstone and its data can sit in different files.

That grace period is a bet: every replica that missed the delete will
hear about it before the tombstone goes. Lose the bet and you get the
zombie back. A node that stays down longer than the grace period still
has the old value, and once the tombstones elsewhere are gone, repair
copies that value back to everyone.

## Where it gets tricky

**Repair has to beat the grace period.** Cassandra's advice is to run
repair on every node often enough that the grace period never expires on
unrepaired data: with the default ten days, at least once every seven.
A node that has been down longer than the grace period shouldn't simply
rejoin.

**Deleted data still costs.** Nothing is removed until compaction runs,
even after the grace period, so the old data and its tombstone both
stay on disk until then. Tables with many deletes or short TTLs carry
that dead weight.

**The same idea, one level down.** [[lsm-tree|LSM trees]] use tombstones
for a different reason: their files are immutable, so a delete has to be
a new entry that hides older ones until compaction merges them away.
Replicated LSM stores like Cassandra have both reasons at once.

## What this means when you build

- In any system where replicas repair each other, never delete by
  removing: write a delete marker.
- Keep markers at least as long as your longest gap between successful
  repairs, and alert when repair falls behind.
- Treat a replica that was away longer than that window as suspect:
  rebuild it rather than letting it rejoin.
- Watch the ratio of tombstones to live data on tables with heavy
  deletes or TTLs.

## Further reading

- [Tombstones](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/tombstones.html), Apache Cassandra docs, version 5.0. Zombies, the grace period, and the three-replica walkthroughs with and without tombstones.
- [Repair](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/repair.html), Apache Cassandra docs, version 5.0. Why repair has to run within the grace period.
- [Epidemic Algorithms for Replicated Database Maintenance](https://bitsavers.org/pdf/xerox/parc/techReports/CSL-89-1_Epidemic_Algorithms_for_Replicated_Database_Maintenance.pdf), Demers et al., Xerox PARC, PODC 1987. Death certificates, and why a plain delete gets undone.
