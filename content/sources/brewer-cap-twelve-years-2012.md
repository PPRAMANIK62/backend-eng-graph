---
id: brewer-cap-twelve-years-2012
title: "CAP Twelve Years Later: How the \"Rules\" Have Changed"
author: Eric Brewer
url: https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/
kind: blog
primary: true
---

## Summary

Brewer's own look back at CAP (first in IEEE Computer, 2012, republished
by InfoQ). Says "2 of 3" was always misleading, that CAP only forbids
perfect consistency and availability during a partition, that the
choice happens per operation at a timeout, and that the real work is
managing partitions: detect, go into a partition mode, recover.

## Key claims

- The classic statement. "The CAP theorem states that any networked shared-data system can have at most two of three desirable properties:" (top)
- The two-of-three version was always misleading. "formulation was always misleading because it tended to oversimplify the tensions among properties." (top)
- What CAP actually forbids. "CAP prohibits only a tiny part of the design space: perfect availability and consistency in the presence of partitions, which are rare." (top)
- The two-node picture. "The easiest way to understand CAP is to think of two nodes on opposite sides of a partition." (Why "2 of 3" is misleading)
- History: 1998, 1999, PODC 2000. "The theorem first appeared in fall 1998. It was published in 1999³ and in the keynote address at the 2000 Symposium on Principles of Distributed Computing,⁴ which led to its proof." (Why "2 of 3" is misleading)
- The aim was to widen the design space. "The CAP theorem’s aim was to justify the need to explore a wider design space" (Why "2 of 3" is misleading)
- With no partition there is little reason to give up C or A. "First, because partitions are rare, there is little reason to forfeit C or A when the system is not partitioned." (Why "2 of 3" is misleading)
- The choice can differ per operation, data or user. "Second, the choice between C and A can occur many times within the same system at very fine granularity; not only can subsystems make different choices, but the choice can change according to the operation or even the specific data or user involved." (Why "2 of 3" is misleading)
- All three are continuous, not binary. "Finally, all three properties are more continuous than binary." (Why "2 of 3" is misleading)
- CAP's C is single-copy consistency, not ACID's C. "In contrast, the C in CAP refers only to single?]copy consistency, a strict subset of ACID consistency." (Acid, base, and cap)
- CAP happens at a timeout. "Operationally, the essence of CAP takes place during a timeout, a period when the program must make a fundamental decision-the partition decision:" (Cap-latency connection)
- Retrying forever is choosing C. "At some point the program must make the decision; retrying communication indefinitely is in essence choosing C over A." (Cap-latency connection)
- A partition is a time bound on communication. "Thus, pragmatically, a partition is a time bound on communication." (Cap-latency connection)
- No global notion of a partition. "The first is that there is no global notion of a partition, since some nodes might detect a partition, and others might not." (Cap-latency connection)
- Tight time bounds enter partition mode when the network is merely slow. "systems with tighter bounds will likely enter partition mode more often and at times when the network is merely slow and not actually partitioned." (Cap-latency connection)
- Forfeiting P is unclear. "As some researchers correctly point out, exactly what it means to forfeit P is unclear." (Cap confusion)
- The hidden cost of choosing A: you must know your invariants. "Another aspect of CAP confusion is the hidden cost of forfeiting consistency, which is the need to know the system’s invariants." (Cap confusion)
- The three steps of managing a partition. "This strategy should have three steps: detect partitions, enter an explicit partition mode that can limit some operations, and initiate a recovery process to restore consistency and compensate for mistakes made during a partition." (Why "2 of 3" is misleading)
- Unique keys: allow duplicates during the partition, merge after. "For example, for the invariant that keys in a table are unique, designers typically decide to risk that invariant and allow duplicate keys during a partition." (Which operations should proceed?)
- Where it came from: building highly available cluster systems in the 1990s. "In the mid-1990s, my colleagues and I were building a variety of cluster-based wide-area systems (essentially early cloud computing), including search engines, proxy caches, and content distribution systems." (Why "2 of 3" is misleading)
- Operations that can't be undone, like charging a card, are recorded and run after recovery. "In this case, the strategy is to record the intent and execute it after the recovery." (Which operations should proceed?)
- The credit card example. "Externalized events, such as charging a credit card, often work this way." (Which operations should proceed?)

## Visuals worth redrawing

- Figure 1: the state of the system over time, splitting into two
  partition-mode branches and merging at recovery.

## My notes

- The InfoQ text has a character glitch in "single?]copy"; the quote
  keeps it as printed.
- The InfoQ page spells the heading "missleading"; locations above use
  the correct spelling.
