---
id: lamport-byzantine-generals-1982
title: The Byzantine Generals Problem
author: Leslie Lamport, Robert Shostak, Marshall Pease
url: https://lamport.azurewebsites.net/pubs/byz.pdf
kind: paper
primary: true
---

## Summary

The paper that named the problem (ACM TOPLAS 4(3), 1982). Generals must
agree on a plan while some of them are traitors who send different
messages to different generals. With plain messages you need more than
two-thirds loyal; with unforgeable signatures, any number of traitors
can be handled.

## Key claims

- Failed components may send conflicting information to different parts of the system; the paper models this as generals and traitors. (abstract)
- The goal is only that the loyal generals agree. "The problem is to find an algorithm to ensure that the loyal generals will reach agreement." (abstract)
- With oral (unsigned) messages, more than two-thirds must be loyal; one traitor can confuse two loyal generals. "It is shown that, using only oral messages, this problem is solvable if and only if more than two-thirds of the generals are loyal; so a single traitor can confound two loyal generals." (abstract)
- With signed messages, any number of traitors. "With unforgeable written messages, the problem is solvable for any number of generals and possible traitors." (abstract)
- To cope with m traitors using oral messages you need at least 3m + 1 generals. (section 3)
- A traitor can send different values to different generals, so each loyal general must get the same set of values. "a traitorous general may send different values to different generals." (1)

## Visuals worth redrawing

- Figures 1 and 2: three generals, one traitor, and why a lieutenant
  can't tell which of the other two is lying.

## My notes

- The scanned PDF's text layer is spotty in places; quotes here come
  from the clean parts (abstract, introduction).
