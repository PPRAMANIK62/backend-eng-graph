---
id: realtime-sync
title: Real-time sync
depth: deep
phase: 17
note: >-
  Keeping many clients in sync live: operational transforms vs CRDTs,
  and a server in the middle.
needs: [crdts, websockets, fencing-tokens, operational-transformation]
leads_to: []
compare_with: [long-polling]
---

# Real-time sync

Real-time sync is what lets several people edit the same document and
see each other's changes as they type. Every client keeps its own copy,
applies its own edits at once so typing never waits on the network, and
swaps changes with the others, usually through a server over
[[websockets]]. The hard part is two edits made at the same moment
against different versions of the document. There are two families of
answers, operational transformation and [[crdts|CRDTs]], and many real
systems add a server in the middle that makes either one simpler.

## Two edits that cross

Take the text `ABCDE` on a client and a server. At the same moment the
client deletes the fourth character and the server deletes the second.
If each side just applies what it receives, they end up with different
text, because "position 4" meant something different on each side by
the time it arrived. An edit carries a position that was only true in
the version it was made against. Every live-sync design is an answer to
that.

## Operational transformation: fix up the operation

[[operational-transformation|Operational transformation]] (OT) rewrites
each incoming edit against the edits it crossed before applying it: the
server turns the client's "delete 4" into "delete 3", and both sides
agree. OT is the older technique and powers most collaborative text
editors, Google Docs among them. It's manageable because of a server in
the middle: the Jupiter system (1995) had every client sync only with
the server, which puts all changes in one order and turns an n-way
problem into many two-way ones. Google Wave (2010) went further, making
each client wait for the server's acknowledgment before sending more,
so the server only keeps its own history. The price is that other
people's edits arrive in chunks, about once per round trip.

## CRDTs: operations that never need fixing

The other family avoids fixing up edits by changing what an edit refers
to. A [[crdts|CRDT]] is a data type that every replica can update
without coordinating, with the merge rule built into the type, so all
replicas end up the same once they've seen the same changes.

For text, that means an edit no longer says "delete position 4". Each
character gets a permanent, unique ID when it's inserted, and an edit
says "delete character `x7`". Deleted characters stay behind as hidden
markers (tombstones). Positions only exist at the edges: the user's click is turned
into an ID on the way in, and the ID back into a position on the way
out.

Two things follow for your backend:

- **CRDTs don't need a server, but can use one.** They sync over any
  channel: a server, peer to peer, even a file on a USB stick. A server
  that stores and forwards changes is fine, and helps when two users
  are never online at the same time.
- **History piles up.** A text CRDT keeps a record of every insert and
  delete. In the Ink & Switch team's own use, memory and disk use grew
  quickly, and the history can't simply be trimmed, because someone
  might come back after six months offline and need to merge from where
  they left off.

The one conflict a CRDT can't settle by itself is two people setting
the same property of the same object at once. A CRDT library can keep
both values and let the app or the user choose; a last-writer-wins
register just keeps the latest. Either way it's
[[conflict-resolution]] under another name.

## Figma: a server-ordered middle ground

Figma's multiplayer editor, described by its co-founder in 2019, shows
how much a central server lets you drop. A Figma document is a tree of
objects, which you can picture as a map from object ID to a map of
properties. The server keeps the last value any client sent for each
property of each object.

- **Two clients changing different properties never conflict.**
  Changing the same property of the same object is a conflict, and the
  last value to reach the server wins. That's a last-writer-wins
  register, but ordered by the server instead of by timestamps, so no
  clocks are involved.
- **The cost is that text doesn't merge.** If a text value is `B` and
  one person changes it to `AB` while another changes it to `BC`, the
  result is `AB` or `BC`, never `ABC`. Fine for a design tool, wrong
  for a text editor.
- **No flicker.** A client applies its own changes at once. When the
  server sends a change to a property the client has an
  unacknowledged edit for, the client ignores it, since its own edit
  will reach the server later and win.
- **IDs without a round trip.** Each client has a unique client ID and
  puts it inside the IDs of objects it creates, so objects can be made
  offline without collisions (see [[id-generation]]).
- **The server enforces rules the data type can't.** Two people can
  move A under B and B under A at the same time. The server rejects the
  second move that would create a cycle.
- **Reconnecting is simple.** After time offline, the client downloads
  a fresh copy, reapplies its offline edits on top, and carries on.

Figma borrowed ideas from CRDTs without using true CRDTs, because
CRDTs are built for systems with no central authority and pay for that
in memory and speed.

## The server is a stateful service

When you do put a server in the middle, it's an unusual backend
service: it holds live, changing state in memory, and every
client editing a document has to reach the same copy.

![Three clients, each with a local copy, connect over WebSockets to one document server. The server holds the document in memory, validates and orders each change, applies it, and broadcasts it to the other clients. It appends every change, with a sequence number, to a journal, and writes the whole document as a checkpoint now and then. The journal is written only while the server holds the document's lock. After a crash, the server loads the checkpoint and replays newer journal entries.](img/realtime-sync-server.svg)

*One document, one server process, and the two things it persists. Adapted from Darren Tsung, "Making multiplayer more reliable" (Figma, 2022).*

Figma runs one process per document, and everyone editing that
document connects to it. That process holds the file in memory for
speed. Three problems come with that:

**Losing what's in memory.** Figma used to save the whole file to S3
every 30 to 60 seconds (a checkpoint), so a crash could lose up to a
minute of work. So it added a journal (described in 2022): each change
gets a sequence number and is written asynchronously to a durable
store (DynamoDB), with a goal of losing under a second of work. After a crash the server loads the last checkpoint and
replays every journal entry with a higher sequence number. This is a
[[write-ahead-log]] plus [[checkpoints]], the same pattern a database
uses. Clients send updates about every 33 ms, so the journal batches
them; 95% of changes were persisted within about 600 ms.

**Two servers for one document.** If clients of one file land on two
different server instances, each sees a different document: split
brain. And two instances writing the same journal would corrupt it.
Figma makes an instance take a lock on the file and makes every
journal write conditional on still holding it, which is the idea
behind [[fencing-tokens]].

**Routing.** Every client must reach the instance that owns its
document, so the load balancer can't just pick any free server.

## Where it gets tricky

**OT vs CRDT is an open argument.** CRDT work has often presented OT
as incorrect, complex and slow. OT researchers answer that text CRDTs
still transform operations, just indirectly (position to ID and back),
with correctness and complexity problems of their own, and that OT
still runs the large majority of working co-editors. Figma found OT overkill for a design
tool and CRDTs more than it needed with a server in charge. Which fits
depends on your data (long text or objects with properties) and on
whether you want to work without a server.

**Converging isn't the same as being right.** Both families make
everyone end up with the same document. Neither guarantees it's the
document anyone meant: the "delete everything" transform converges
too. How close you get depends on how well the transform or merge rule
is designed, and [[crdts]] shows how text CRDTs can still scramble
concurrent typing.

**Picking the unit of conflict.** Figma merges per property and so
loses concurrent text edits; a text CRDT merges per character and keeps
every edit. Pick the unit to match what users expect to merge.

**Undo.** With other people editing, "undo my last change" can
overwrite what someone else did since. Figma's rule: undoing a lot,
copying something, and redoing back to the present must leave the
document unchanged.

## What this means when you build

- Don't design this from scratch if you can avoid it. For text, use a
  proven OT or CRDT library. For objects with properties, a
  server-ordered last-writer-wins per property is much simpler.
- Let clients apply their own edits at once and reconcile later. That's
  what makes collaboration feel instant.
- Treat the sync server as stateful: route by document, keep one owner
  per document with a lock or lease, and journal changes before you
  trust memory.
- Plan for history growth and for clients that come back after a long
  time offline.
- For simple "tell me when something changes" updates, you don't need
  any of this; [[long-polling]] or [[server-sent-events]] are enough.

## Further reading

- [High-Latency, Low-Bandwidth Windowing in the Jupiter Collaboration System](https://lively-kernel.org/repository/webwerkstatt/projects/Collaboration/paper/Jupiter.pdf), David A. Nichols, Pavel Curtis, Michael Dixon, John Lamping, Xerox PARC, UIST 1995. The paper behind client-server OT: the transform function and the server that serializes and echoes.
- [Google Wave Operational Transformation](https://svn.apache.org/repos/asf/incubator/wave/whitepapers/operational-transform/operational-transform.html), David Wang, Alex Mah, Soren Lassen, Google, 2010. How waiting for acknowledgments lets the server keep a single history.
- [How Figma's multiplayer technology works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/), Evan Wallace, Figma, 2019. A production design that borrows from CRDTs with a server in charge, with its edge cases.
- [Making multiplayer more reliable](https://www.figma.com/blog/making-multiplayer-more-reliable/), Darren Tsung, Figma, 2022. The sync server as a stateful service: checkpoints, a journal, and a lock against split brain.
- [Local-first software](https://www.inkandswitch.com/essay/local-first/), Martin Kleppmann, Adam Wiggins, Peter van Hardenberg, Mark McGranaghan, Ink & Switch, 2019. CRDTs in practice, the role left for servers, and the history-growth problem.
- [Real Differences between OT and CRDT](https://arxiv.org/pdf/1905.01518), Chengzheng Sun, David Sun, Agustina Ng, Weiwei Cai, Bryden Cho, 2020. The OT side of the argument: CRDTs as indirect transformation.
