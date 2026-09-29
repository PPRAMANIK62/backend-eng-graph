---
id: jepsen-causal
title: "Causal Consistency"
author: Jepsen
url: https://jepsen.io/consistency/models/causal
kind: docs
primary: false
---

## Summary

Jepsen's reference page on causal consistency: causally related
operations appear in the same order everywhere, unrelated ones may not.
Covers convergence, sticky availability, and the stronger variants
(real-time causal, causal+) that real systems usually provide.

## Key claims

- The definition. "Causal consistency captures the notion that causally-related operations should appear in the same order on all processes—though processes may disagree about the order of causally independent operations." (top)
- The lunch example: the question always comes before the answers. "However, no participant ever observes “yes” or “no” prior to the question “lunch?”." (top)
- The lunch example's cast. "consider a single object representing a chat between three people, where Attiya asks “shall we have lunch?”, and Barbarella & Cyrus respond with “yes”, and “no”, respectively." (top)
- Convergent causal systems agree once the same operations are visible. "Convergent causal systems require that the values of objects in the system converge to identical values, once the same operations are visible." (top)
- It is sticky available. "Causal consistency is sticky available: even in the presence of network partitions, every client connected to a non-faulty node can make progress. However, clients must stick to the same server." (top)
- Real-time causal is the strongest model an always-available system can have. "A slightly stronger version of causal consistency, Real-Time Causal, is proven to be the strongest consistency model in an always-available, one-way convergent system." (top)
- Most real systems give more than plain causal. "Most “causally consistent” systems actually provide these stronger properties, such as RTC or causal+." (top)
- Total availability costs causal and read-your-writes. "If you need total availability, you’ll have to give up causal (and read-your-writes), but can still obtain writes follow reads, monotonic reads, and monotonic writes." (top)
- It stems from Lamport's happens-before. "Causal memory stems from Lamport’s definition of the happens-before relation, which captures the notion of potential causality" (Formally)
- Mahajan et al. leave concurrent writes to the implementation. "Mahajan et al. leave conflict resolution (what to do with concurrent writes) up to the implementation, requiring only that all concurrent writes are returned for a read." (Formally)

## Visuals worth redrawing

None.

## My notes

- No author is named on the page, so the author field says Jepsen.
