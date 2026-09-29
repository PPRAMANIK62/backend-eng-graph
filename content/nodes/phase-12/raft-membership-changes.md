---
id: raft-membership-changes
title: Raft membership changes
depth: short
phase: 12
note: >-
  Adding and removing nodes without ever having two majorities.
needs: [raft-log-replication]
leads_to: []
compare_with: []
---

# Raft membership changes

Sooner or later you replace a dead server in a [[raft]] cluster, or grow
from three servers to five. The danger is that servers learn about the
new membership at different moments, and for a while the old group and
the new group could each form a majority and elect two leaders in the
same term. Raft avoids that by putting the membership itself in the log
and changing it in steps small enough that old and new majorities
always overlap.

## Why you can't just switch

Grow a cluster from S1 to S3 to S1 to S5 in one go. Some servers see the
new list before others. For a moment, S1 and S2 still think the cluster
is three servers, where two is a majority. S3, S4 and S5 already think
it's five, where three is a majority. Both groups can elect a leader in
the same term, and the committed-data guarantee is gone.

![Left, unsafe: growing from three servers to five in one step. S1 and S2, still on the old three-server configuration, form a majority of it; S3, S4 and S5, on the new five-server configuration, form a majority of that. The two groups don't overlap, so each could elect its own leader. Right, safe: growing from three to four. Any majority of the old three (two servers) and any majority of the new four (three servers) must share at least one server.](img/raft-membership-changes-overlap.svg)

*Changing many servers at once can split into two majorities; changing one can't. Adapted from Diego Ongaro, "Consensus: Bridging Theory and Practice", figures 4.2 and 4.3 (2014).*

## One server at a time

If you add or remove a single server, every majority of the old
configuration overlaps every majority of the new one, in clusters of
either odd or even size. That overlap is the same thing Raft's safety
depends on everywhere else: some server that saw the earlier decision
always takes part in the next one. So a single-server change can switch
directly.

The mechanism reuses the log:

1. The leader appends the new configuration as a special log entry and
   [[raft-log-replication|replicates]] it like any other.
2. Every server starts using a configuration as soon as it's in its log,
   committed or not.
3. Once that entry is committed under the new configuration, the change
   is done. The leader can report success, a removed server can be shut
   down, and only now may the next change start.

Because servers use a configuration before it's committed, a leader
change can remove an uncommitted configuration entry, and a server then
falls back to the previous one in its log. Bigger changes, like going
from three to five, are a series of single steps.

## The bug found after publication

This single-server scheme came from Ongaro's dissertation. The next year
he announced a bug in it, found while it was being formalized. Within
one term, one leader keeps changes one server apart. Across a leader
change it can go wrong. Start with four servers. S1, the leader, begins
adding S5, copies that configuration only to S5, and goes offline. S2
becomes leader of the next term without having seen it, and removes S1,
committing that on itself and S3 under the smaller configuration. Then
S1 comes back, wins a later term with votes from S1, S4 and S5 under its
five-server configuration, and overwrites S2's committed entry. Split
brain and lost data.

The fix is one rule: **a leader may not start a configuration change
until it has committed an entry from its own term.** In practice that's
the no-op a new leader commits at the start of its term. Once that's
committed, any uncommitted configuration from an earlier leader can never
be committed, so the two competing changes can't both win. The original
joint consensus method, below, was not affected.

## Joint consensus

Raft's authors first came up with a different method, which handles
arbitrary changes in one go. The cluster moves to a transitional **joint configuration**
that contains both the old and new sets. While it's in effect, every
election and every commit needs a majority of the old set *and* a
majority of the new set. Going from three servers to nine, that's two of
the three and five of the nine. Once the joint entry commits, the leader
adds an entry for the new configuration alone. At no point can either
set decide on its own. The dissertation now recommends single-server
changes as simpler.

## Keeping the cluster available while it changes

Safety is only half of it. Three practical problems:

- **New servers start empty.** Add an empty fourth server to a
  three-server cluster and lose one of the originals, and the cluster
  needs three of four to commit, but the new one can't help until it
  catches up. So a new server first joins as a **non-voting member**:
  it receives the log but doesn't count toward majorities. The leader
  promotes it once it has caught up, for example when a round of
  catch-up takes less than an election timeout. If the server is down
  or too slow, the change should be aborted.
- **Removing the leader.** Either transfer leadership to another server
  first, or let the leader run the change and step down once the new
  configuration commits, managing a cluster it's no longer part of in
  between.
- **Removed servers can disrupt the cluster.** A server that's been
  removed stops getting heartbeats, times out, and sends RequestVote
  with a higher term, knocking out the leader again and again. The
  [[raft-elections|Pre-Vote]] check doesn't always help, because the
  removed server's log can be up to date. The fix: a server ignores
  RequestVote if it heard from a current leader within the minimum
  election timeout.

## What this means when you build

- Change membership one server at a time, and don't start a change until
  the leader has committed an entry in its term.
- Add new servers as non-voting members, catch them up, then promote.
- Never let a failed server be removed automatically without a policy:
  a cluster that removes failed servers can shrink below the number of
  copies you meant to keep.

## Further reading

- [Consensus: Bridging Theory and Practice](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf), Diego Ongaro, 2014. Chapter 4: single-server changes, catching up new servers, removing the leader, disruptive servers, and joint consensus.
- [bug in single-server membership changes](https://groups.google.com/g/raft-dev/c/t4xj6dJTP6E/m/d2D9LrWRza8J), Diego Ongaro, raft-dev mailing list, 2015. The counter-examples and the one-line fix.
