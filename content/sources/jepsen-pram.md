---
id: jepsen-pram
title: "PRAM"
author: Jepsen
url: https://jepsen.io/consistency/models/pram
kind: docs
primary: false
---

## Summary

Jepsen's reference page on PRAM (pipeline random access memory): each
process's writes are seen everywhere in the order it made them. Notes
that PRAM is exactly three of the four session guarantees together, and
how available each combination is.

## Key claims

- The definition. "It enforces that any pair of writes executed by a single process are observed (everywhere) in the order the process executed them; however, writes from different processes may be observed in different orders." (top)
- PRAM is three session guarantees together. "PRAM is exactly equivalent to read your writes , monotonic writes , and monotonic reads ." (top)
- It's sticky available. "PRAM is sticky available: in the event of a network partition, all processes can make progress so long as clients always stick to the same server." (top)
- Adding writes follow reads gives causal consistency, just as available. "For a more strict consistency model which also enforces that writes follow reads , try causal consistency : it’s just as available, and provides more intuitive semantics." (top)
- For total availability, drop read your writes. "If you need total availability, consider sacrificing read your writes and choosing just monotonic reads + monotonic writes ." (top)

## Visuals worth redrawing

None.

## My notes

- No author is named on the page, so the author field says Jepsen.
- The sibling pages (read your writes, monotonic reads, monotonic
  writes) say the same about availability: read your writes is sticky
  available, the other two totally available.
