---
id: dunning-t-digest-2019
title: Computing Extremely Accurate Quantiles Using t-Digests
author: Ted Dunning, Otmar Ertl
url: https://arxiv.org/abs/1902.04023
kind: paper
primary: true
---

## Summary

The t-digest paper (2019). A t-digest clusters incoming values and keeps
each cluster's mean and count, with small clusters near the tails and
big ones in the middle, so extreme quantiles are especially accurate.
Digests computed separately can be merged.

## Key claims

- Accurate in the tails with small sketches. "We present on-line algorithms for computing approximations of rank-based statistics that give high accuracy, particularly near the tails of a distribution, with very small sketches." (Summary)
- Error relative to how extreme the quantile is. "the method allows a quantile q to be computed with an accuracy relative to max(q, 1− q) rather than absolute accuracy as with most other methods." (Summary)
- Merging without loss. "allows separately computed summaries to be combined with no loss in accuracy." (Summary)
- Clusters hold a mean and a weight. "the bins are summarized by a centroid value and an accumulated weight representing the number of samples contributing to a bin rather than by the upper and lower bounds of the bin." (1)
- Few samples per cluster at the extremes. "the samples are accumulated in such a way that only a few samples contribute to bins corresponding to extreme quantiles" (1)
- The merging variant buffers, sorts and merges. "When the buffer fills, the contents are sorted and merged with the centroids computed from previous samples." (1)
- Used widely. "has been incorporated into prominent open-source projects such as Apache Lucene and Elasticsearch." (Conclusion)

## Visuals worth redrawing

None.

## My notes

- Unlike DDSketch, the guarantee is on rank, scaled by how close q is to
  0 or 1, not on the value.
