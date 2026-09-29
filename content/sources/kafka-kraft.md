---
id: kafka-kraft
title: KRaft (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/operations/kraft/
kind: docs
primary: true
---

## Summary

The Kafka 4.3 operations page for KRaft mode: process roles,
controllers, the controller quorum and its membership.

## Key claims

- Each server is a broker, a controller, or both. "In KRaft mode each Kafka server can be configured as a controller, a broker, or both using the process.roles property." (Process Roles)
- Running both on one server isn't for production. "Combined mode is not recommended in critical deployment environments." (Process Roles)
- Three or five controllers. "A Kafka admin will typically select 3 or 5 servers for this role" (Controllers)
- A majority must be up. "With 3 controllers, the cluster can tolerate 1 controller failure; with 5 controllers, the cluster can tolerate 2 controller failures." (Controllers)
- Moving off ZooKeeper goes through 3.9. "The last bridge release is Kafka 3.9." (ZooKeeper to KRaft Migration)

## Visuals worth redrawing

None.

## My notes

None.
