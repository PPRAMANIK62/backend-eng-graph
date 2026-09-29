---
id: google-wave-ot-2010
title: Google Wave Operational Transformation
author: David Wang, Alex Mah, Soren Lassen (Google)
url: https://svn.apache.org/repos/asf/incubator/wave/whitepapers/operational-transform/operational-transform.html
kind: docs
primary: true
---

## Summary

Google's whitepaper (version 1.1, 2010) on how Wave extended
Jupiter-style client-server OT. The key change: a client waits for the
server to acknowledge its operation before sending more, buffering and
composing local edits meanwhile. That lets the server keep one history
instead of one state space per client.

## Key claims

- Local edits apply at once; remote ones are transformed first. "Local editing operations are executed without being delayed or blocked. Remote operations are transformed before execution." (Introduction)
- Wave started from Jupiter. "The starting point for Wave OT was the paper "High-latency, low-bandwidth windowing in the Jupiter collaboration system"." (Introduction)
- Basic OT makes the server keep a state space per client. "One shortcoming of this is the server needs to carry a state space for every connected client, which can be memory-intensive." (Clients wait for acknowledgement)
- Wave's change: one operation in flight per client. "Wave OT modifies the basic theory of OT by requiring the client to wait for acknowledgement from the server before sending more operations." (Clients wait for acknowledgement)
- What an acknowledgment means. "When a server acknowledges a client's operation, it means the server has transformed the client's operation, applied it to the server's copy of the wavelet and broadcast the transformed operation to all other connected clients." (Clients wait for acknowledgement)
- The server then only needs its own history. "the server only needs to have a single state space, which is the history of operations it has applied." (Clients wait for acknowledgement)
- The server's job per operation: transform, apply, broadcast. "When it receives a client's operation, it only needs to transform the operation against the operation history, apply the transformed operation, and then broadcast it." (Clients wait for acknowledgement)
- The cost: other people's edits arrive in chunks. "One trade-off of this simplification is that a client will see chunks of operations from another client in intervals of approximately one round trip time to the other client." (Clients wait for acknowledgement)
- While waiting, the client composes its pending operations. "While a Wave client awaits server acknowledgement, it composes all its pending operations." (Composition)
- The client buffers local operations while it waits. "Whilst the client is waiting for the acknowledgement, it caches operations produced locally and sends them in bulk later." (Clients wait for acknowledgement)

## Visuals worth redrawing

- The state-space diagrams (client and server taking different OT paths
  to one state). Not redrawn.

## My notes

- Hosted in the Apache Wave incubator SVN; Wave itself was retired, but
  the page still loads.
