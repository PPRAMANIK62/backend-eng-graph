---
id: session-guarantees
title: Session guarantees
depth: short
phase: 11
note: >-
  Read your writes, monotonic reads, monotonic writes and writes follow
  reads: what one client can count on.
needs: [replication-lag, eventual-consistency]
leads_to: []
compare_with: [causal-consistency, consistency-models]
---

# Session guarantees

A session guarantee is a promise a replicated store makes to one client
about that client's own reads and writes, even when each request lands
on a different replica. There are four: read your writes, monotonic
reads, monotonic writes and writes follow reads. They ask for far less
than strong consistency, and they cover most of what a single user
notices when replicas disagree.

## One client, many copies

Picture replicas that pass changes to each other in the background:
[[eventual-consistency]]. The copies agree in the end, but at any moment
one can be behind another, and a client whose requests land on
different replicas sees a different copy each time.

A **session** is that client's sequence of operations: one browser
tab, one app process. Each guarantee rules out one way the copies can
surprise it. Xerox PARC's Bayou project named them in 1994.

**Read your writes.** A read sees every write this session made before
it. Without it, you change your password and the login check, on a
replica the change hasn't reached yet, rejects the new one.

**Monotonic reads.** Once the session has seen some writes, later reads
never see a state without them. Without it, a meeting on your calendar
is there on one refresh and gone on the next.

Those two are about what you read, and [[replication-lag]] covers them
with a leader and lagging followers. The other two are about the order
your writes land in.

**Monotonic writes.** A write reaches a replica only after this
session's earlier writes have. Without it, you save version 1 of a file
and then version 2, the saves go to different replicas, and some third
replica applies version 2 first and then overwrites it with version 1.

**Writes follow reads.** If the session read something and then writes,
its write is ordered after what it read, on every replica. Without it,
you read a post and reply to it, and a replica that got your reply
before the post shows other readers an answer to a question they can't
see.

![Two panels, each with a session and replicas A, B and C. Monotonic writes, broken: the session saves v1 on replica A and then v2 on replica B. Replica C gets v2 from B first, then v1 from A later, and ends on v1, the older save. Writes follow reads, broken: the session reads a post from replica A and writes a reply to replica B. Replica C gets the reply first and the post later, so for a while it shows a reply with no post.](img/session-guarantees-writes.svg)

*The two write guarantees, each broken by a replica that hears about the
later write first.*

Read your writes and monotonic reads only protect the session itself.
The two write guarantees fix an order in every copy, so everyone sees
it. On a message board, only the person replying needs a session;
people who just read need nothing.

## How a client keeps track

The 1994 design puts the work in a small session manager on the client.
It keeps two sets of write IDs:

- **write-set:** the writes this session made.
- **read-set:** the writes behind everything this session has read.

Before reading from a replica, it checks the replica already has the
write-set (read your writes) and the read-set (monotonic reads). Before
writing, it checks the replica has the write-set (monotonic writes) and
the read-set (writes follow reads). If a replica fails the check, the
client tries another one, or tells the application the guarantee can't
be met right now.

The paper squeezes each set into a [[vector-clocks|version vector]],
one counter per server. With a single
leader it's simpler still: each set shrinks to one position in the
leader's log, which is the "remember a log position" fix in
[[replication-lag]]. And the replica a session used last always
passes, so a session that stays on one replica can skip the checks.
They only matter when the session has to move, say because its replica
went down.

## Where it gets tricky

**They cost availability, differently.** Each guarantee narrows the set
of replicas a session may use, which is why the paper lets each session
pick only the ones it needs. Monotonic reads and monotonic writes can
be kept by any replica even during a partition. Read your writes can't:
if your write is stuck on the far side, a replica on your side has to
wait or refuse. It holds during a partition only if the client sticks to
one server.

**Together they're other models.** Read your writes, monotonic reads
and monotonic writes together are exactly a model called PRAM: each
client's writes are seen everywhere in the order it made them.
[[causal-consistency]] also enforces writes follow reads, and is just as
available. If you need every replica to answer every client, you give up
read your writes and keep monotonic reads and monotonic writes. See
[[consistency-models]] for where these sit on the ladder.

**A session is what you make it.** The guarantees follow the session,
not the person. A phone and a laptop are two sessions unless you pass
the state between them. The Grapevine password fix needed a session
that outlived logouts and reboots. A client cache shared with a program
that read an older replica can break them too.

**Settings matter.** MongoDB's causally consistent sessions give all
four only with "majority" read and write concern. With local reads and
`w: 1` writes, you get none.

**They aren't isolation.** They do nothing about two clients changing
the same data at once; that's [[isolation-levels]].

## What this means when you build

- Pick per feature: read your writes after a user's own edit,
  monotonic reads where flicker confuses, monotonic writes for a series
  of updates to one thing, writes follow reads for replies.
- Keep the session's position with the client, in the session or a
  cookie, and send it with each request.
- Decide what happens when no replica is caught up: wait, use the
  leader, or fail clearly.

## Further reading

- [Session Guarantees for Weakly Consistent Replicated Data](https://www.cs.cornell.edu/courses/cs734/2000FA/cached%20papers/SessionGuaranteesPDIS_1.html), Douglas Terry and others, Xerox PARC, PDIS 1994. The four guarantees, with examples and the read-set and write-set design.
- [PRAM](https://jepsen.io/consistency/models/pram), Jepsen. How three of the guarantees add up to PRAM, and how available each combination is.
- [Causal Consistency and Read and Write Concerns](https://www.mongodb.com/docs/manual/core/causal-consistency-read-write-concerns/), MongoDB manual. A database that offers all four, and the settings they depend on.
