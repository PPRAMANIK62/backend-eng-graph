---
id: crosby-tamper-evident-logging-2009
title: Efficient Data Structures for Tamper-Evident Logging
author: Scott A. Crosby, Dan S. Wallach (Rice University)
url: https://www.usenix.org/legacy/event/sec09/tech/full_papers/crosby.pdf
kind: paper
primary: true
---

## Summary

USENIX Security 2009. Treats a log server as untrusted and makes it
prove its honesty to auditors: that an old event is still in the log,
and that today's log extends yesterday's. Replaces hash chains, whose
proofs grow linearly, with a Merkle-tree "history tree" whose proofs are
logarithmic.

## Key claims

- The setting: an untrusted logger kept honest by auditors. "This paper considers the case of an untrusted logger, serving a number of clients who wish to store their events in the log, and kept honest by a number of auditors who will challenge the logger to prove its correct behavior." (Abstract)
- The two things a logger must prove. "The logger must be able to prove that individual logged events are still present, and that the log, as seen now, is consistent with how it was seen in the past." (Abstract)
- Hash chains make proofs huge. "Where a classic hash chain might require an 800 MB trace to prove that a randomly chosen event is in a log with 80 million events, our prototype returns a 3 KB proof with the same semantics." (Abstract)
- The tree gives logarithmic proofs. "we describe a tree-based data structure that can generate such proofs with logarithmic size and space, improving over previous linear constructions." (Abstract)
- The logger signs a commitment per event. "A log is a dynamic data structure, with the author signing a stream of commitments, a new commitment each time a new event is added to the log." (2)
- Each commitment covers the whole log so far. "Each commitment snapshots the entire log up to that point." (2)
- Commitments must be spread to auditors, or client and logger can collude. "This prevents the clients from subsequently colluding with the logger to roll back or modify their events." (2.2)
- Forking defense: auditors compare commitments. "in order to deal with the logger presenting different views of the log to different auditors and clients, auditors must obtain and reconcile commitments received from multiple clients or auditors" (2.2)
- Measured throughput of their prototype. "measure its performance on an 80 million event syslog trace at 1,750 events per second using a single CPU core." (Abstract)

## Visuals worth redrawing

- Figures 1 and 2: history trees at versions 2 and 6.

## My notes

- RFC 9162 (Certificate Transparency) says its Merkle tree is essentially
  this history tree.
