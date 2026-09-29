---
id: pugh-skip-lists-1990
title: "Skip Lists: A Probabilistic Alternative to Balanced Trees"
author: William Pugh
url: https://15721.courses.cs.cmu.edu/spring2018/papers/08-oltpindexes1/pugh-skiplists-cacm1990.pdf
kind: paper
primary: true
---

## Summary

The paper that introduced skip lists (Communications of the ACM, 1990;
this copy is hosted by CMU's 15-721 course). A sorted linked list where
each node also gets a random number of extra "express" pointers.
Search, insert and delete run in expected logarithmic time, with code
much simpler than balanced trees, because balance comes from a random
number generator instead of rotations.

## Key claims

- The one-line pitch. "Skip lists use probabilistic balancing rather than strictly enforced balancing and as a result the algorithms for insertion and deletion in skip lists are much simpler and significantly faster than equivalent algorithms for balanced trees." (abstract)
- Plain binary trees degrade on some input orders, like sorted inserts. "Some sequences of operations, such as inserting the elements in order, produce degenerate data structures that give very poor performance." (introduction)
- The analysis assumes users can't see node levels; if they could, they could force the worst case. "We assume an adversarial user does not have access to the levels of nodes; otherwise, he could create situations with worst-case running times by deleting all nodes that were not level 1." (Probabilistic Philosophy)
- Bad worst case, but no input triggers it reliably. "Although skip lists have bad worst-case performance, no input sequence consistently produces the worst-case performance" (introduction)
- Example of how unlikely a slow search is. "for a dictionary of more than 250 elements, the chance that a search will take more than 3 times the expected time is less than one in a million" (introduction)
- Space: about 1⅓ pointers per element. "They can easily be configured to require an average of 1 1 / 3 pointers per element (or even less)" (introduction)
- Building up the idea: a pointer every 2nd node halves the nodes examined; every 4th node another halving, and so on down to log2 n. "while only doubling the number of pointers." (Skip Lists, Figure 1d; the bound before it is typeset with ceiling brackets that don't survive text extraction)
- Randomize the levels in the same proportions and insertions stay local. "Insertions or deletions would require only local modifications; the level of a node, chosen randomly when the node is inserted, need never change." (Skip Lists)
- Where the name comes from. "Because these data structures are linked lists with extra pointers that skip over intermediate nodes, I named them skip lists." (Skip Lists)
- Search: move right while the next key is smaller, else drop a level. "When no more progress can be made at the current level of forward pointers, the search moves down to the next level." (Search Algorithm)
- Insert and delete are search plus splice. "To insert or delete a node, we simply search and splice" (Insertion and Deletion Algorithms)
- A node's level is picked by repeated coin flips with probability p, capped at MaxLevel. "Levels are generated without reference to the number of elements in the list." (Choosing a Random Level, Figure 5)
- MaxLevel 16 is enough for 2^16 elements with p = 1/2. "If p = 1/2, using MaxLevel = 16 is appropriate for data structures containing up to 216 elements." (Determining MaxLevel; "216" is 2^16 with the superscript lost)
- A smaller p is a little faster but more variable. "choosing p = 1/4 (rather than 1/2) slightly improves the constant factors of the speed of the algorithms as well." (Choosing p)
- The recommended p. "I suggest that a value of 1/4 be used for p unless the variability of running times is a primary concern, in which case p should be 1/2." (Choosing p)
- Concurrent updates are simpler than for balanced trees. "This algorithms are much simpler than concurrent balanced tree algorithms." (Additional Work on Skip Lists)
- Average pointers per node is 1/(1 − p): 2 for p = 1/2, 1.33 for p = 1/4. "Avg. # of pointers per node (i.e., 1/(1 – p))" (Table 1, column header; values read from the table)

## Visuals worth redrawing

- Figure 1: the same sorted list with no extra pointers, every 2nd,
  every 4th, every 2^i-th node, and random levels (e).
- Figure 3: inserting 17, with the search path and the pointers that
  change.

## My notes

- Balanced-tree comparison timings (Table 2) are from 1990 hardware.
  Not used.
