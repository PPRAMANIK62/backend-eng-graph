---
id: operational-transformation
title: Operational transformation
depth: short
phase: 17
note: >-
  Rewriting concurrent edits against each other so every copy of a
  shared document ends up the same.
needs: [eventual-consistency]
leads_to: [realtime-sync]
compare_with: [crdts]
---

# Operational transformation

Operational transformation (OT) is how many collaborative editors keep
everyone's copy of a document the same while several people type at
once. Each person's edits apply locally right away, so typing never
waits for the network, and the copies converge afterwards, a form of
[[eventual-consistency]]. When an edit arrives from someone else, it's
first rewritten against the edits it crossed on the way, then applied.
OT dates from the late 1980s and still powers most collaborative text
editors, Google Docs among them. It's the main alternative to
[[crdts|CRDTs]], which avoid the rewriting by changing what an edit
refers to.

## Two edits that cross

Take the smallest possible document, the text `ABCDE`, with a client
and a server each holding a copy. At the same moment, the client
deletes the fourth character (`D`) and the server deletes the second
(`B`). Each applies its own delete right away, then sends it to the
other.

If each side just applies what it receives, they drift apart. The
client has `ABCE` and applies "delete 2", getting `ACE`. The server has
`ACDE` and applies "delete 4", which now points at `E`, getting `ACD`.
Both did what they were told, and they no longer agree.

The problem is that "position 4" meant something different on each
side by the time it arrived. An edit carries a position that was only
true in the version it was made against.

![Two panels, each with a client and a server starting from ABCDE. The client applies del 4 and has ABCE; the server applies del 2 and has ACDE. Each then applies the other's operation. In the first panel, forwarded as is, the client ends with ACE and the server with ACD: they diverge, because the server deleted E instead of D. In the second panel the server rewrites the client's del 4 as del 3 before applying it, and both end at ACE.](img/operational-transformation-deletes.svg)

*Two deletes that cross. Adapted from Nichols et al., "High-Latency, Low-Bandwidth Windowing in the Jupiter Collaboration System" (1995), figure 3.*

## The transform: fix up the operation

Operational transformation (OT) repairs the incoming edit before
applying it. You write a function that takes two operations made
against the same version and returns adjusted versions of both, with
one rule: applying mine then your adjusted one must give the same
result as applying yours then my adjusted one.

For two deletes the rule is simple: if the other side deleted something
earlier in the text, shift your position down by one. The server turns
the client's "delete 4" into "delete 3", both sides end at `ACE`, and
both deletes did what their authors meant.

Converging isn't the whole goal, though. A transform that turned every
pair of operations into "delete everything" would also make both sides
agree. A good transform keeps what each person meant. That's where OT
gets hard: every pair of operation types needs its own transform, some
pairs are much harder than two deletes, and the possible states
multiply until they're very hard to reason about.

## Why a server in the middle makes OT manageable

With many clients, each editing against a slightly different version,
the possible orderings explode. The Jupiter system at Xerox PARC (1995)
cut the problem down with a central server. Each client syncs only with
the server, never with other clients. The server puts all changes in
one order and echoes each one to everyone else. That turns an n-way
problem into many two-way problems, one per client-server link, and
the two-way case is the one the transform above solves.

Google Wave (2010) took it a step further. In plain Jupiter-style OT
the server has to track a separate state space for every connected
client, which costs memory and complicates the server. Wave made each
client wait for the server to acknowledge its operation before sending
the next one, buffering and combining its local edits in the meantime.
An acknowledgment means the server has transformed the operation,
applied it, and broadcast it. So the server only needs one thing: its
own history of applied operations. Each new operation is transformed
against that history, applied, and sent on.

The price is visible to users: another person's edits reach you in
chunks, roughly once per round trip to them, instead of keystroke by
keystroke.

## Where it gets tricky

**It's hard to get right.** Figma's engineers chose not to use OT for
their product because it was more complex than their problem needed:
OT is efficient for long text, but hard to implement correctly, and its
possible states explode. Most of the difficulty is in transforms for
pairs of operations beyond simple inserts and deletes.

**The server is part of the algorithm.** The Jupiter-style designs rely
on a central server to order edits. That's a real service with state,
not just a relay; see [[realtime-sync]] for what it takes to run one.

**The debate with CRDTs isn't settled.** Some CRDT research described
OT as incorrect, complex and inefficient. OT researchers answer that
text CRDTs also transform positions, just indirectly (turning positions
into identifiers and back), with correctness and complexity problems of
their own, and that CRDTs remain rare in working editors. Both sides
agree the problem is hard.

## What this means when you build

- Don't write your own OT for rich text if a tested library fits.
- If you do, keep a central server that orders operations, and prefer
  the Wave-style "one operation in flight per client" protocol: the
  server only needs its own history.
- Test transforms by checking convergence and intent on every pair of
  operation types, not just two deletes.

## Further reading

- [High-Latency, Low-Bandwidth Windowing in the Jupiter Collaboration System](https://lively-kernel.org/repository/webwerkstatt/projects/Collaboration/paper/Jupiter.pdf), David A. Nichols, Pavel Curtis, Michael Dixon, John Lamping, Xerox PARC, UIST 1995. The paper behind client-server OT: the transform function and the server that serializes and echoes.
- [Google Wave Operational Transformation](https://svn.apache.org/repos/asf/incubator/wave/whitepapers/operational-transform/operational-transform.html), David Wang, Alex Mah, Soren Lassen, Google, 2010. How waiting for acknowledgments lets the server keep a single history.
- [How Figma's multiplayer technology works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/), Evan Wallace, Figma, 2019. A production design that borrows from CRDTs with a server in charge, with its edge cases.
- [Real Differences between OT and CRDT](https://arxiv.org/pdf/1905.01518), Chengzheng Sun, David Sun, Agustina Ng, Weiwei Cai, Bryden Cho, 2020. The OT side of the argument: CRDTs as indirect transformation.
