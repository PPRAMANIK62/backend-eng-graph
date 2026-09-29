---
id: mirrokni-bounded-loads-2016
title: Consistent Hashing with Bounded Loads
author: Vahab Mirrokni, Mikkel Thorup, Morteza Zadimoghaddam (Google Research, University of Copenhagen)
url: https://arxiv.org/pdf/1608.01350
kind: paper
primary: true
---

## Summary

arXiv paper (2016, v3 2017) that adds a hard cap to consistent hashing:
no server may take more than (1 + ε) times the average load. A key
that lands on a full server keeps walking the ring to the next one
with room. The paper proves this moves only a bounded number of keys
per change, and reports use in Google Cloud Pub/Sub and at Vimeo.

## Key claims

- Plain consistent hashing and rendezvous hashing balance no better than random assignment. "However, the load balancing of these schemes is no better than a random assignment of clients to servers" (Abstract)
- With one point per server, the busiest server likely has about log n times the average. "One problem with simple consistent hashing as described above is that the maximum load is likely to be Θ(log n) times bigger than the average." (1.1)
- The fix is linear probing on the ring. "In order to cope with given capacity constraints, we apply the idea of linear probing by forwarding the ball on the circle to the first non-full bin." (Abstract)
- Plain consistent hashing needs no history, only the ids and the hash. "One of the nice features of consistent hashing is that it is history-independent" (1.1)
- Two production uses. "namely Google’s cloud system [MTZ16] and Vimeo’s video streaming [Rod16]." (1)
- Vimeo picked c = 1.25. "he found a load balancing parameter c = 1.25 to be satisfactory for Vimeo’s video steaming." (1, typo in the original)
- The knob c = 1 + ε trades balance against stability. "our algorithm provides a simple knob, the load balancing parameter c = 1 + ε, which captures the tradeoff between load balancing and stability upon changes in the system." (1)

## Visuals worth redrawing

None used.

## My notes

- The bound on moves is O(1/ε²) per client change and O(m/(ε² n)) per
  server change for ε ≤ 1 (Theorem 3); the Google blog post states it
  in plain words.
