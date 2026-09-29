---
id: athanassoulis-rum-conjecture-2016
title: "Designing Access Methods: The RUM Conjecture"
author: Manos Athanassoulis, Michael S. Kester, Lukas M. Maas, Radu Stoica, Stratos Idreos, Anastasia Ailamaki, Mark Callaghan
url: https://openproceedings.org/2016/conf/edbt/paper-12.pdf
kind: paper
primary: true
---

## Summary

EDBT 2016 vision paper. Names the three overheads of any access method
(read, update, memory), defines each as an amplification ratio, shows
with a toy array that making any one of them perfect blows up another,
and conjectures that bounding two sets a floor on the third. Places B-trees,
LSM trees, hash indexes, bloom filters and others on a triangle.

## Key claims

- The three overheads. "(1) the read overhead (R), (2) the update overhead (U), and (3) the memory (or storage) overhead (M), henceforth called the RUM overheads." (§1)
- Read overhead as read amplification, defined as a ratio. "We refer to RO as the read amplification: the ratio between the total amount of data read including auxiliary and base data, divided by the amount of retrieved data." (§2)
- Update overhead as write amplification. "We refer to UO as the write amplification: the ratio between the size of the physical updates performed for one logical update, divided by the size of the logical update." (§2)
- Memory overhead as space amplification. "We refer to MO as the space amplification, defined as the ratio between the space utilized for auxiliary and base data, divided by the space utilized for base data." (§2)
- The minimum of each is 1.0, and you can't reach all three at once. "The theoretical minimum for each overhead is to have the ratio equal to 1.0" (§2)
- Flash favors low update overhead. "storage with limited endurance (like flash-based drives) favors minimizing the update overhead" (§2)
- Minimizing only update cost means appending every update to a log, and read and space grow without bound. "In order to minimize UO, we append every update, effectively forming an ever increasing log." (§2, Prop. 2)
- Minimizing only space means no index: a dense array, full scans. "When minimizing MO, no auxiliary data is stored and the base data is stored as a dense array." (§2, Prop. 3)
- The conjecture. "An access method that can set an upper bound for two out of the read, update, and memory overheads, also sets a lower bound for the third overhead." (§3)
- Read-optimized structures include hash indexes, B-trees, tries, skip lists; they "increase space overhead and suffer with frequent updates". (§4)
- Write-optimized differential structures such as the LSM tree batch updates and apply them in bulk. "The fundamental idea is to consolidate updates and apply them in bulk to the base data." (§4)
- Space-optimized side: compression, bloom filters, sparse indexes. "Example categories include compression techniques and lossy index structures such as Bloom filters" (§4)
- Most structures are a point in the space that moves with parameters such as B+tree fan-out. "The exact position of the point may differ based on some parameters (for example, the fan-out of B+ -Trees" (§5)
- Minimizing only read cost: store each value at the block numbered by the value, so reads are exact but space is unbounded. "RO is now minimal because we always know where to find a specific value (if it exists), and we only read useful data." (§2, Prop. 1: min(RO) = 1.0 ⇒ UO = 2.0 and MO → ∞)

## Visuals worth redrawing

- Figure 1: triangle with read-optimized, write-optimized and
  space-optimized corners, and data structures placed on it (hash and
  B-tree near the read corner, LSM near the write corner, bloom filters
  and sparse indexes near the space corner).

## My notes

- It's a conjecture, not a proof. The paper says so in its own title
  for §3.
