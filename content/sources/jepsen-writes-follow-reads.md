---
id: jepsen-writes-follow-reads
title: "Writes Follow Reads"
author: Jepsen
url: https://jepsen.io/consistency/models/writes-follow-reads
kind: docs
primary: false
---

## Summary

Jepsen's reference page on writes follow reads (session causality): a
write you make after reading a value is ordered after the write that
produced that value. Totally available.

## Key claims

- The definition. "Writes follow reads, also known as session causality, ensures that if a process reads a value v, which came from a write w₁, and later performs write w₂, then w₂ must be visible after w₁." (top)
- In short. "Once you’ve read something, you can’t change that read’s past." (top)
- It's totally available. "Writes follow reads is a totally available property." (top)

## Visuals worth redrawing

None.

## My notes

- No author is named on the page, so the author field says Jepsen.
