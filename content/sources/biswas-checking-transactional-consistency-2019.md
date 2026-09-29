---
id: biswas-checking-transactional-consistency-2019
title: On the Complexity of Checking Transactional Consistency
author: Ranadeep Biswas, Constantin Enea (IRIF, Université de Paris)
url: https://arxiv.org/pdf/1908.04509
kind: paper
primary: true
---

## Summary

A theory paper (OOPSLA 2019; arXiv 1908.04509v1 read) on how hard it is
to check a recorded history against each isolation level. Some levels are
cheap to check, others are NP-complete in general, and the hard ones
become polynomial if you fix the number of sessions (clients).

## Key claims

- Read committed, read atomic and causal consistency are polynomial to check; prefix consistency and snapshot isolation are NP-complete. "We show that consistency models like read committed, read atomic, and causal consistency are polynomial time checkable while prefix consistency and snapshot isolation are NP-complete in general." (abstract)
- Serializability was already known to be NP-complete. "Checking serializability has been shown to be NP-complete [23]" (section 1)
- With a fixed number of sessions, the NP-complete ones become polynomial, though exponential in the number of sessions. "their verification problem becomes polynomial time provided that, roughly speaking, the number of sessions in the input executions is considered to be fixed" (section 1)
- Unique written values make the write-read relation easy to get, and cost nothing in bug-finding power because databases don't depend on the values. "Therefore, this assumption is without loss of generality." (section 1)
- Unique values are easy to make: a per-client counter plus a client id. "This can be easily enforced by tagging values with unique identifiers" (section 1)
- Jepsen's older checks targeted specific kinds of violation. "Jepsen checks consistency in a rather ad-hoc way, focusing on specific classes of violations to a given consistency model" (section 1)

## Visuals worth redrawing

None needed.

## My notes

- Written before Elle's paper came out; its remark about Jepsen being
  "ad hoc" describes the older, pattern-based checkers.
