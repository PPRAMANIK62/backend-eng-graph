---
id: comer-ubiquitous-btree-1979
title: The Ubiquitous B-Tree
author: Douglas Comer
url: http://carlosproal.com/ir/papers/p121-comer.pdf
kind: paper
primary: false
---

## Summary

A survey in ACM Computing Surveys 11(2), 1979. Explains the B-tree of
Bayer and McCreight, its costs, and its variants, above all the
B+-tree, where all keys live in the leaves and the leaves are linked
for sequential access. Read from a copy of the ACM PDF hosted on a
personal site; the ACM site refused the download.

## Key claims

- The B-tree was already the standard for database indexes in 1979. "The B-tree is, de facto, the standard organization for indexes in a database system." (Introduction)
- The cost that matters is the number of secondary storage accesses. "Therefore, the number of secondary storage accesses serves as a reasonable cost measure for evaluating index methods." (Introduction)
- A read transfers a fixed amount of data, so time grows with the number of reads. "most random access devices transfer a fixed amount of data per read operation, so that the total time required is linearly related to the number of reads." (Introduction)
- Bayer and McCreight proposed it at Boeing Scientific Research Labs. "R. Bayer and E. McCreight, then at Boeing Scientific Research Labs, proposed an external index mechanism with relatively low cost for most of the operations defined in the previous section; they called it a B-tree" (1. The Basic B-Tree)
- Nobody knows what the B stands for. "The origin of "B-tree" has never been explained by the authors." (footnote 1)
- A node of order d holds between d and 2d keys, so every node is at least half full. (1. The Basic B-Tree, paraphrase; the fraction is garbled in the PDF's text layer)
- The balancing algorithms keep all leaves at the same depth. "The beauty of B-trees lies in the methods for inserting and deleting records that always leave the tree balanced." (Balancing)
- A plain B-tree is poor at sequential processing: "next" can walk several nodes. "Unfortunately, a B-tree may not do well in a sequential processing environment." (2. The Cost of Operations)
- Merging (concatenation) can cascade to the root and reduce the height by one. "Finally, if the descendants of the root are concatenated, they form a new root, decreasing the height of the Btree by 1." (Deletion; "Btree" as in the text layer)
- In a B+-tree all keys are in the leaves; the upper levels are only an index. "In a B+-tree, all keys reside in the leaves." (B+-Trees)
- The leaves are linked left to right, the "sequence set". "Sequence set links allow easy sequential processing." (B+-Trees)
- On a leaf split a copy of the key is promoted and the key stays in the right leaf. "When a leaf splits in two, instead of promoting the middle key, the algorithm promotes a copy of the key, retaining the actual key in the right leaf." (B+-Trees)
- Deleting a key doesn't require changing the index while the leaf stays at least half full. "As long as the leaf remains at least half full, the index need not be changed, even if a copy of the key had been propagated up into it." (B+-Trees)
- "B*-tree" is a misused name: Knuth's B*-tree keeps nodes 2/3 full. "Perhaps the most misused term in B-tree literature is B*-tree." (B*-Trees)

## Visuals worth redrawing

- Figure 13, a B+-tree with separate index and key parts and linked leaves. Redrawn in `b-plus-tree`.

## My notes

- Old (1979) but still the clearest statement of B-tree vs B+-tree.
- Quotes checked against the PDF's text layer, which has OCR errors in
  places; only clean sentences are quoted.
