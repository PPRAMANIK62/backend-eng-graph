---
id: zanzibar
title: Zanzibar
depth: deep
phase: 15
note: >-
  Google's authorization system: relation tuples, the check API and
  consistent snapshots.
needs: [authorization-models, consistency-models]
leads_to: [new-enemy-problem]
compare_with: [dual-writes]
---


# Zanzibar

Zanzibar is the service that decides who can see and edit what across
Google Drive, Calendar, Photos, YouTube, Cloud and more. It stores
permissions as small facts called relation tuples, answers "does user
U have relation R to object O?", and evaluates every answer at one
consistent snapshot of the data. Google described it in a 2019 paper,
and open-source systems such as SpiceDB and OpenFGA were modelled on it. It's the reference point for any
[[authorization-models|relationship-based authorization]] service,
including the one this phase builds.

## Permissions as tuples

Everything Zanzibar stores has one shape:

```
object#relation@user
```

A few examples, taken from the paper:

```
doc:readme#owner@10                  user 10 owns doc:readme
group:eng#member@11                  user 11 is a member of group:eng
doc:readme#viewer@group:eng#member   members of group:eng can view doc:readme
doc:readme#parent@folder:A#...       doc:readme is inside folder:A
```

The third line is the important trick. The "user" side can be a set of
users, written as another `object#relation`. That's how groups work:
a group is just an object with a `member` relation, and granting a
group access is one tuple. Groups can contain groups, so a check may
have to follow a long chain.

The last line isn't a permission at all. It records a fact about
objects (this document is in that folder) that rules can use later.

Storing tuples instead of a list per object means sharing a document
with someone is one small write, and removing them is one small
delete.

## Rules live in the schema, not in the data

You don't want to store "user 10 is a viewer" next to "user 10 is an
owner" for every document. Instead, each type of object gets a config
that says how relations imply each other. In the schema language of SpiceDB, a Zanzibar-inspired system, a
document might look like this:

```
definition document {
  relation parent: folder
  relation owner: user
  relation editor: user | group#member
  relation viewer: user | group#member

  permission edit = owner + editor
  permission view = edit + viewer + parent->view
}
```

Relations (`owner`, `editor`) are stored as tuples. Permissions
(`edit`, `view`) are computed. `+` is union, and there's also `&`
(intersection) and `-` (exclusion). The arrow `parent->view` means
"follow the `parent` tuple to the folder, and include whoever can view
the folder". Zanzibar's paper calls these pieces `this`,
`computed_userset` and `tuple_to_userset`.

Because permissions are computed, you can change one ("commenters can
now view") by editing the schema, without rewriting any
tuples. Relations are harder to change, since the data depends on
them.

## Answering a check

A check is a question: can `user:alice` `view` `doc:readme`? Zanzibar
turns the schema into a boolean expression and walks the tuples.

![A graph of tuples. user alice is a member of group eng. Members of group eng are viewers of folder A. doc readme's parent is folder A. The check "can alice view doc readme?" expands view into three branches: owner or editor (no tuple), direct viewer (no tuple), and parent then view on the folder. The third branch finds folder A, sees group eng's members are viewers, and finds alice in group eng, so the answer is yes.](img/zanzibar-check-walk.svg)

*One check, walked through the tuples. Branches run in parallel, and the first one that proves the answer cancels the rest. Tuple notation from Pang et al., "Zanzibar" (2019).*

Each leaf of the expression is a tuple lookup, and a userset leaf
("members of group:eng") is a check of its own. Zanzibar evaluates the
leaves at the same time, and when one branch settles the answer it
cancels the others.

Besides Check there are four other calls:

- **Read** returns stored tuples as they are, without applying the
  schema. Reading `viewer` tuples won't show owners.
- **Expand** returns the full tree of who has a relation, following
  the schema. Clients use it to build search indexes that respect
  permissions.
- **Write** adds or removes tuples. To change many tuples on one
  object safely, a client reads them along with a per-object "lock"
  tuple, then writes on condition the lock tuple hasn't changed, and
  retries if it has. That's [[optimistic-concurrency]].
- **Watch** streams tuple changes in timestamp order, for clients
  that keep their own indexes.

## Every check sees one snapshot

Zanzibar keeps its tuples in Spanner, Google's globally
[[replication|replicated]] database, with several versions of each
tuple so it can read the data as of any recent timestamp. Every check
reads all the tuples it needs at a single timestamp. A check never
mixes a group membership from one moment with a folder permission from
another.

That alone isn't enough. Permissions change, and the order of changes
matters. If Alice removes Bob from a folder and then puts a new
document in it, no check should see the new document with the old
membership. Zanzibar gets this from Spanner's external consistency: if
one write causally happened before another, it gets a smaller
timestamp. A snapshot at time T then includes everything that
happened before anything it includes. (For where this guarantee sits
among the others, see [[consistency-models]] and [[linearizability]].)

Reading the very latest snapshot on every check would need a
cross-region round trip, and would be less available.
Zanzibar avoids that with a token called a zookie. When your app saves
new content, it asks Zanzibar for a zookie and stores it with the
content. Later checks on that content pass the zookie back, and
Zanzibar promises to use a snapshot at least that fresh. Any fresher
snapshot is fine, so most checks run on data that's already
replicated locally. This is Zanzibar's defense against the
[[new-enemy-problem]], which has its own page.

## Making it fast

Zanzibar stores tuples in normalized form, one fact per row, because
that keeps them consistent. The price is [[hot-spots|hot spots]]: a popular group
sits on the path of a huge number of checks. The paper calls hot
spots the most critical problem it faced for latency and availability.
The fixes:

- **A distributed cache** across the servers in a cluster, placed with
  [[consistent-hashing]]. Intermediate results ("is alice in
  group:eng?") are cached too, not just final answers.
- **Snapshot in the cache key, rounded.** A cached answer is only
  valid for its snapshot, so the timestamp is part of the key. Zanzibar
  rounds evaluation timestamps up to a coarse step, such as 1 or 10
  seconds, so that most checks land on the same few snapshots and
  share cache entries. Rounding up is still safe: a read at a future
  timestamp waits until that time has passed.
- **A lock table** so that when many requests want the same uncached
  answer, only one computes it and the rest wait for its result. It's
  the fix for a [[cache-stampede]].
- **Leopard**, a separate index for deeply nested groups. It flattens
  group-in-group chains ahead of time, so "is this user in this group"
  becomes an intersection of two sorted lists of IDs instead of a walk.
  An offline build is always behind, so Leopard merges in recent
  changes from Watch at query time to stay consistent.
- **Hedged requests** to storage and Leopard: send a second copy of a
  slow request and use whichever answers first. Zanzibar doesn't hedge
  checks between its own servers, because checks vary so much in cost
  that hedging would duplicate the most expensive ones. See
  [[tail-latency]].
- **Per-client limits** on CPU and outstanding requests, so one
  misbehaving client can't hurt the others.

Over a 7-day sample in 2018, Zanzibar held more than 2 trillion tuples
in over 1,500 namespaces and served more than 10 million requests a
second. "Safe" checks, with a zookie more than 10 seconds old, could
mostly be served in the local region; at peak they took about 3 ms at
the median and 11 ms at the 95th percentile. "Recent" checks, with a
fresher zookie, often had to cross regions, and their 95th percentile
averaged 60 ms. They were about a hundred times rarer. Writes, which always need Spanner to
coordinate, took 127 ms at the median.

## Where it gets tricky

**The clones don't all copy the consistency part.** SpiceDB has
zookies under the name ZedTokens, with per-request levels from
"minimize latency" to "fully consistent". OpenFGA's docs list
zookies as future work: you choose between serving from its cache and
skipping the cache, and a check right after a write can miss that
write if it's served from the cache. Neither runs on Spanner, and it
shows: on CockroachDB, SpiceDB's own docs warn that "fully consistent"
doesn't guarantee read-after-write, because node clocks can differ.
They point you to tokens instead.

**Defaults favour speed.** Without a zookie, Zanzibar picks a
recent snapshot, and SpiceDB defaults most reads to its fastest,
cache-friendly mode. A permission you just granted can take a moment
to appear. That's usually fine for grants. It's the revocations you
have to handle with tokens.

**Your permissions now live in a second system.** The tuples sit in
the authorization service, the documents in your database. Every
share, move and delete writes to both, which is a [[dual-writes]]
problem, and the zookie has to be stored in the same transaction as
the content it protects.

**Listing is harder than checking.** "Can Alice see this?" is one
check. "Which of these 10,000 documents can Alice see?" is the search
problem, and Zanzibar's answer was to fan out tens to hundreds of
checks per page of results, or use Expand to build a
permission-aware index.

**Schema mistakes fail quietly.** In SpiceDB, `+` binds tighter than
`&` and `-` for historical reasons, so `a + b & c` means `(a + b) &
c`. An intersection of two relations that can never hold the same kind
of subject just returns false, with no error, unless you turn on type
checking.

## What this means when you build

- Model with tuples and a schema: store relationships, compute
  permissions. Keep relations few and stable; change permissions
  freely.
- Store a consistency token next to every piece of content, update it
  when the content or its access changes, and send it with every
  check on that content.
- Cache check results, but always with the snapshot in the key.
- Deduplicate identical in-flight checks, and watch for hot groups.
- Test the schema against a brute-force evaluator. The phase 15 lab
  plans its harness around exactly that.

## Further reading

- [Zanzibar: Google's Consistent, Global Authorization System](https://www.usenix.org/system/files/atc19-pang.pdf), Ruoming Pang and others, USENIX ATC, 2019. The paper: data model, consistency model, zookies, architecture and production numbers.
- [Schema Language Reference](https://authzed.com/docs/spicedb/concepts/schema), SpiceDB documentation. The readable schema syntax used above, operators, arrows and the precedence trap.
- [Consistency](https://authzed.com/docs/spicedb/concepts/consistency), SpiceDB documentation. ZedTokens, per-request consistency levels, and the CockroachDB caveat.
- [Concepts](https://openfga.dev/docs/concepts), OpenFGA documentation. Another Zanzibar-style model, with conditions for attributes.
- [Query Consistency Modes](https://openfga.dev/docs/interacting/consistency), OpenFGA documentation. How OpenFGA handles freshness without zookies.
