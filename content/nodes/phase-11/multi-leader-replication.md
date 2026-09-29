---
id: multi-leader-replication
title: Multi-leader replication
depth: short
phase: 11
note: >-
  Several nodes take writes, and conflicts become normal.
needs: [replication]
leads_to: [conflict-resolution]
compare_with: []
---

# Multi-leader replication

In multi-leader replication, more than one node accepts writes for the
same data and each passes its writes on to the others. You get writes
that keep working when a site or a laptop is cut off, and writes that
stay local to each region. You also get conflicts: two leaders can
change the same record at the same time, and neither knew about the
other.

## Two copies, both writable

Start with the simplest case, from the CouchDB docs. Alice keeps Bob's
business card in a small database that she syncs between her desktop
and her laptop. Both copies take edits on their own.

- She syncs, so both machines have version v1.
- On the desktop she changes Bob's email address.
- Without syncing, on the laptop she changes Bob's mobile number.
- Then she syncs again.

![Two columns, desktop and laptop. Both start with v1 of Bob's card. The desktop edits the email to make v2a; the laptop edits the phone number to make v2b. After replicating both ways, each side holds both v2a and v2b as conflicting revisions, and one of them is shown as the winner.](img/multi-leader-replication-business-card.svg)

*Both edits survive replication, as two conflicting versions. Adapted from the Apache CouchDB docs, "Replication and conflict model".*

Each machine was a leader for this document. After the sync, the
desktop has an email change the laptop never saw, and the laptop has a
phone change the desktop never saw. That's a conflict, and nothing went
wrong to cause it. Two leaders plus concurrent edits is all it takes.

The same shape shows up at a larger scale with databases spread across
regions. A DynamoDB global table has one replica table in each AWS
Region you choose. Your app writes to the replica in its own Region,
and DynamoDB copies the write to all the others, asynchronously and
typically within a second. Every replica is a leader.

Compare this with [[leader-follower-replication]], where one node
orders all writes and conflicts can't happen. Multi-leader trades that
single order for local writes and for writes during a cut-off. It's one
of the shapes of [[replication]], next to leader-follower and
[[leaderless-replication]].

## What each system does with a conflict

**CouchDB keeps both.** After replication, both v2a and v2b exist on
both machines, as conflicting revisions in the document's revision
tree. A normal read returns one of them as the "winner". The choice is
arbitrary but deterministic, so every peer picks the same one. The
loser isn't deleted, just hidden, and your app has to ask for it, merge
the two, write the merged version and delete the loser. Here the merge
is easy: take the email from one and the phone from the other.

**DynamoDB picks one.** In its default mode, when the same item is
changed in two Regions at once, the change with the latest internal
timestamp wins, item by item, and every replica ends up with that
version. The other change is gone.

Those are the two broad answers, keep and merge or pick a winner, and
choosing between them is [[conflict-resolution]].

## What you give up

Anything that relies on seeing the latest version stops working across
leaders.

- **Check-then-write only checks locally.** On a single CouchDB node,
  every update must name the revision it replaces, and a stale one is
  refused with a 409 Conflict. That's
  [[optimistic-concurrency]]. Across two leaders there's no one place
  to do that check. In DynamoDB, a conditional write is checked
  against the item in its own Region only.
- **Strong reads are local.** A strongly consistent DynamoDB read in
  one Region can return stale data if the item was last changed in
  another.
- **[[transaction|Transactions]] are local.** In the default global table mode, a
  transaction is atomic only in the Region where it ran. Other Regions
  can see part of it while it replicates.
- **A Region failure strands recent writes.** The default mode's
  recovery point is the replication delay, usually a few seconds. Writes
  not yet copied out of an impaired Region aren't available elsewhere
  until that Region recovers and sends them on.

DynamoDB also offers the other trade. Its multi-Region strong
consistency mode replicates each write to at least one other Region
before confirming it, needs exactly three Regions (or two plus a
witness), and rejects a write
to an item that another Region is changing at that moment, with an
error you retry. That removes conflicts by coordinating, which is what
multi-leader was avoiding, and it costs a cross-Region round trip per
write.

## Where it gets tricky

**Conflicts are silent by default.** A plain CouchDB read shows the
winner with no hint that a conflict exists. Unless your app asks for
conflicts, an edit can look lost. A background job that sweeps and
merges conflicts leaves a window where a change the user saved seems to
vanish, then reappears.

**The history you'd merge from may be gone.** A three-way merge wants
the common ancestor, but CouchDB compaction throws away the bodies of
old revisions. To merge by diff, store the diff in the new revision.

**Local checks give a false sense of safety.** A uniqueness check or a
balance check that passes in one Region says nothing about what another
Region accepted in the same second.

## What this means when you build

- Use multi-leader when writes must keep working apart: offline
  devices, or regions that must accept writes on their own.
- Decide for every kind of record how conflicts are resolved, before
  you ship. Timestamps silently drop one of two concurrent writes.
- Keep invariants that need one order (unique names, balances) on a
  single leader, or use a strongly consistent mode for them.
- Test with two replicas cut off from each other, writing to the same
  records.

## Further reading

- [Replication and conflict model](https://docs.couchdb.org/en/stable/replication/conflicts.html), Apache CouchDB docs, version 3.5. The business card example, revision trees, deterministic winners and how to merge.
- [How DynamoDB global tables work](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html), AWS docs. Multi-Region writes with last-writer-wins, what stays local, and the strongly consistent alternative.
