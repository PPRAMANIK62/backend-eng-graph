---
id: riak-causal-context
title: "Causal Context (Riak KV docs)"
author: Basho Technologies (Riak KV docs)
url: https://docs.riak.com/riak/kv/latest/learn/concepts/causal-context/index.html
kind: docs
primary: true
---

## Summary

How Riak KV (2.2.3 docs) decides whether one version of an object
replaces another or conflicts with it: vector clocks, then dotted
version vectors from 2.0. What happens with concurrent writes (siblings,
a CRDT merge, or timestamp resolution), and why siblings can pile up.

## Key claims

- Conflicts are expected in an eventually consistent store. "Because Riak is an eventually consistent, clustered database, conflicts between object replicas stored on different nodes are inevitable, particularly when multiple clients update an object simultaneously." (Causal Context)
- A CRDT can merge concurrent values by its own rules. "The object is a CRDT, so Riak is able to resolve conflicting values by type-specific rules" (Causal Context)
- With allow_mult on, concurrent writes become siblings. "If you set the allow_mult parameter to true for a bucket type, all non-CRDT writes to that bucket type will create siblings in the case of concurrent writes" (Causal Context)
- With it off, a timestamp picks the winner. "If, however, allow_mult is set to false, then Riak will not generate siblings, instead relying on simple timestamp resolution to decide which value “wins.”" (Causal Context)
- The docs recommend siblings. "In general, we recommend always setting allow_mult to true." (Causal Context)
- Vector clocks count events, not time. "Unlike normal clocks, vector clocks have no sense of chronological time" (Vector Clocks)
- Vector clocks spot concurrency but can't tell which value came from which update. "Vector clocks can detect concurrent updates to the same object but they can’t identify which value was associated with each update." (Dotted Version Vectors)
- A DVV tags each value with the event that made it. "each of these updates will be marked with a dot (a minimal vector clock) that indicates the specific event that introduced it." (Dotted Version Vectors)
- So siblings stay bounded. "Rather than being potentially unbounded, the number of sibling values will be proportional to the number of concurrent updates." (Dotted Version Vectors)
- Riak 2.0 and later should use DVVs. "If you are using Riak version 2.0 or later, we strongly recommend using dotted version vectors instead of vector clocks, as DVVs are far better at limiting the number of siblings produced in a cluster" (Dotted Version Vectors)
- The client hands the context back on update. "pass that opaque context object back to Riak when you update the object." (Dotted Version Vectors)
- Sibling explosion can take a node down. "At the extreme, having an enormous object in a node can cause reads of that object to crash the entire node." (Sibling Explosion)
- Fix: update inside a read/modify/write cycle. "Always update mutable objects within a read/modify/write cycle." (Sibling Explosion)
- DVVs arrived in 2.0. "In version 2.0, Riak added the option of using dotted version vectors (DVVs) instead." (Dotted Version Vectors)

## Visuals worth redrawing

None.

## My notes

- The DVV paper (Preguiça, Baquero et al.) is linked from the page; not
  opened.
