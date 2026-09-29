---
id: karger-consistent-hashing-1997
title: "Consistent Hashing and Random Trees: Distributed Caching Protocols for Relieving Hot Spots on the World Wide Web"
author: David Karger, Eric Lehman, Tom Leighton, Matthew Levine, Daniel Lewin, Rina Panigrahy (MIT)
url: https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf
kind: paper
primary: true
---

## Summary

The STOC 1997 paper that named consistent hashing. The problem was web
hot spots: too many clients hitting one server. The fix was a layer of
caches, and to find the right cache for a page without every client
agreeing on the exact list of caches, a hash function that changes as
little as possible when caches come and go. Read from a course copy of
the PDF (Princeton COS 518).

## Key claims

- Hot spots: many clients at once on one server. "Hot spots occur any time a large number of clients wish to simultaneously access data from a single server." (1 Introduction)
- The one-line definition. "Roughly speaking, a consistent hash function is one which changes minimally as the range of the function changes." (Abstract)
- A small change in the set of buckets doesn't remap everything. "Unlike standard hashing schemes, a small change in the bucket set does not induce a total remapping of items to buckets." (1.2)
- With a classic hash like `ax + b mod p`, changing the range moves almost every item, so a cache layer becomes useless. "Suddenly, all cached data is useless because clients are looking for it in a different location." (4)
- A view is the set of caches one client knows about; views may disagree. "We define a view to be the set of caches of which a particular client is aware." (4)
- Smoothness: adding or removing a cache moves only the minimum. "When a machine is added to or removed from the set of caches, the expected fraction of objects that must be moved to a new cache is the minimum needed to maintain a balanced load across the caches." (4)
- Monotonicity: items only move to the new bucket, never between old ones. "then an item may move from an old bucket to a new bucket, but not from one old bucket to another." (4.1)
- The construction maps buckets and items to the unit interval and sends each item to the closest bucket point. "In other words, i is mapped to the bucket “closest” to i." (4.2)
- Each bucket needs several points, not one (the paper uses a constant times log C per bucket). "we actually need to have more than one point in the unit interval associated with each bucket." (4.2)
- Implementation: a balanced binary search tree over the points. "A simple implementation uses a balanced binary search tree to store the correspondence between segments of the unit interval and buckets." (4.3)

## Visuals worth redrawing

None; the paper has no ring figure.

## My notes

- The paper's version picks the *closest* point on an interval; the
  "walk clockwise to the next node" ring is how Dynamo, Cassandra and
  Lamping and Veach describe it. Same idea, different wording.
- Spread and load (the multi-view properties) matter for web caches
  where clients see different cache lists, not for storage systems
  where every client sees the same membership.
