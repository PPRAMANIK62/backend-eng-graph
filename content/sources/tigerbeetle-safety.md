---
id: tigerbeetle-safety
title: Safety (TigerBeetle docs)
author: TigerBeetle
url: https://docs.tigerbeetle.com/concepts/safety/
kind: docs
primary: true
---

## Summary

TigerBeetle's concepts page on safety: strict serializability,
Viewstamped Replication, storage fault tolerance, and a short section
on how the code is tested, including the VOPR simulator.

## Key claims

- The VOPR runs a whole cluster of real code under faults, fast. "TigerBeetle is tested in the VOPR – a simulated environment where an entire cluster, running real code, is subjected to all kinds of network, storage and process faults, at 1000x speed." (Software reliability)
- It finds both design and coding bugs. "This simulation can find both logical errors in the algorithms and coding bugs in the source." (Software reliability)
- Scale. "This simulator is running 24/7 on 1024 cores, fuzzing the latest version of the database." (Software reliability)
- Correct algorithms still need a correct implementation. "Even the advanced algorithm with a formally proved correctness theorem is useless if the implementation is buggy." (Software reliability)

## Visuals worth redrawing

None.

## My notes

- "1000x speed" and "1024 cores" are the vendor's own figures, as the
  page stated them when read.
