---
id: figma-multiplayer-2019
title: How Figma's multiplayer technology works
author: Evan Wallace (Figma)
url: https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
kind: blog
primary: true
---

## Summary

Figma's co-founder (2019) on its live collaboration system. Clients talk
to a per-document server process over WebSockets. The document is a map
of object ID to properties; the server keeps the last value sent for
each property, a last-writer-wins register ordered by the server rather
than by timestamps. Inspired by CRDTs, but simplified because the
server is the authority. Covers flicker, object creation and deletion,
reparenting and cycles, fractional indexing, and undo.

## Key claims

- They skipped OT as too complex for their problem. "As a startup we value the ability to ship features quickly, and OTs were unnecessarily complex for our problem space." (intro)
- Client/server over WebSockets, one process per document. "Our servers currently spin up a separate process for each multiplayer document which everyone editing that document connects to." (Background context)
- Reconnect = download a fresh copy and reapply offline edits. "When you come back online, the client downloads a fresh copy of the document, reapplies any offline edits on top of this latest state, and then continues syncing updates over a new WebSocket connection." (Background context)
- OT is good for long text but hard. "They're a great way of editing long text documents with low memory and performance overhead, but they are very complicated and hard to implement correctly." (Critique of OT)
- Not true CRDTs, because there is a central authority. "Since Figma is centralized (our server is the central authority), we can simplify our system by removing this extra overhead and benefit from a faster and leaner implementation." (CRDT)
- The document is a two-level map. "One way to think about this is by picturing the document as a two-level map: Map<ObjectID, Map<Property, Value>>." (How a Figma document is structured)
- The server keeps the latest value per property. "Figma's multiplayer servers keep track of the latest value that any client has sent for a given property on a given object." (Syncing object properties)
- The server's order replaces timestamps. "This approach is similar to a last-writer-wins register in CRDT literature except we don't need a timestamp because the server can define the order of events." (Syncing object properties)
- So concurrent text edits don't merge. "If the text value is B and someone changes it to AB at the same time as someone else changes it to BC, the end result will be either AB or BC but never ABC." (Syncing object properties)
- Local changes apply immediately. "Property changes on the client are always applied immediately instead of waiting for acknowledgement from the server since we want Figma to feel as responsive as possible." (Syncing object properties)
- Drop incoming server changes that conflict with your unacknowledged ones, to avoid flicker. "So we want to discard incoming changes from the server that conflict with unacknowledged property changes." (Syncing object properties)
- Deleted objects' data lives in the deleting client's undo buffer. "That data is instead stored in the undo buffer of the client that performed the delete." (Syncing object creation and removal)
- Client IDs inside object IDs make them unique offline. "This can be easily accomplished by assigning every client a unique client ID and including that client ID as part of newly-created object IDs." (Syncing object creation and removal)
- The server rejects parent changes that would make a cycle. "Figma's multiplayer servers reject parent property updates that would cause a cycle, so this issue can't happen on the server." (Syncing trees of objects)
- Fractional indexing for child order. "You can insert an object between two other objects by setting its position to the average of the positions of the two other objects." (Syncing trees of objects)
- Undo rule. "if you undo a lot, copy something, and redo back to the present (a common operation), the document should not change." (Implementing undo)
- OT's state space explodes. "They result in a combinatorial explosion of possible states which is very difficult to reason about." (Critique of OT)
- CRDT properties, as the post lists them: independent updates. "The application can update any replica independently, concurrently and without coordinating with other replicas." (CRDT sidebar)
- The merge rule is part of the type. "An algorithm (itself part of the data type) automatically resolves any inconsistencies that might occur." (CRDT sidebar)
- Replicas converge. "Although replicas may have different state at any particular point in time, they are guaranteed to eventually converge." (CRDT sidebar)
- A last-writer-wins register keeps the latest update. "You can determine the value of the register by just taking the value of the latest update (using the peer ID to break a tie)." (How OTs and CRDTs informed our multiplayer approach)
- OT runs most text collaboration apps. "As mentioned earlier, OTs power most collaborative text-based apps such as Google Docs." (Critique of OT)

## Visuals worth redrawing

- The animated conflict and flicker examples. Not redrawn.

## My notes

- Comments, users and teams are in Postgres with a separate sync
  system; only document contents go through multiplayer.
