---
id: kleppmann-local-first-2019
title: "Local-first software: You own your data, in spite of the cloud"
author: Martin Kleppmann, Adam Wiggins, Peter van Hardenberg, Mark McGranaghan (Ink & Switch)
url: https://www.inkandswitch.com/essay/local-first/
kind: paper
primary: true
---

## Summary

An Ink & Switch essay (2019, also an Onward! paper) arguing for apps
that keep the primary copy of data on the user's device and sync
through CRDTs. It reports what the authors learned building three
CRDT-based prototypes on Automerge: merging worked, conflicts were
rarer than feared, but CRDT history grew large and networking stayed
unsolved. Servers stay useful, as peers rather than the source of truth.

## Key claims

- CRDTs sync over any channel, including a server. "CRDTs can sync their state via any communication channel (e.g. via a server, over a peer-to-peer connection, by Bluetooth between local devices, or even on a USB stick)." (CRDTs as a foundational technology)
- The one conflict a CRDT can't settle by itself. "The only type of change that a CRDT cannot automatically resolve is when multiple users concurrently update the same property of the same object" (CRDTs as a foundational technology)
- Conflicts were rarer than feared. "we found that users surprisingly rarely encounter conflicts in their work when collaborating with others, and that generic resolution mechanisms work well." (Findings)
- History grows and can't easily be trimmed. "Performance and memory/disk usage quickly became a problem because CRDTs store all history, including character-by-character text edits." (Findings)
- Why trimming is hard. "These pile up, but can't easily be truncated because it's impossible to know when someone might reconnect to your shared document after six months away and need to merge changes from that point forward." (Findings)
- Merging says nothing about delivery. "CRDT algorithms provide only for the merging of data, but say nothing about how different users' edits arrive on the same physical computer." (Findings)
- A server is fine for CRDTs. "CRDTs do not require a peer-to-peer networking layer; using a server for communication is fine for CRDTs." (Findings)
- Servers as cloud peers. "Servers thus have a role to play in the local-first world — not as central authorities, but as "cloud peers" that support client applications without being on the critical path." (Findings)
- OT is the more established technique. "Besides CRDTs, the more established technology for real-time collaboration is Operational Transformation (OT), as implemented e.g. in ShareDB." (Next steps)
- In a centralized system the server decides. "The server determines the truth of a given piece of data." (Findings)
- Without a server, users who are never online together can't sync. "This is excellent for privacy and ownership, but can result in situations where a user shares a document, and then closes their laptop lid before the other user has connected." (Findings)
- A store-and-forward server fixes that. "For example, a cloud peer that stores a copy of the document, and forwards it to other peers when they come online, could solve the closed-laptop problem above." (Findings)
- The CRDT keeps conflicting values for the app to resolve. "in this case, the CRDT keeps track of the conflicting values, and leaves it to be resolved by the application or the user." (CRDTs as a foundational technology)

## Visuals worth redrawing

- The to-do list CRDT diagram. Not redrawn.

## My notes

- Findings are from prototypes used by a five-person team and about ten
  external testers, with no formal method, as the essay says itself.
