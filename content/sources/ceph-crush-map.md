---
id: ceph-crush-map
title: CRUSH Maps (Ceph documentation)
author: Ceph contributors
url: https://docs.ceph.com/en/latest/rados/operations/crush-map/
kind: docs
primary: true
---

## Summary

The Ceph docs page on CRUSH maps (the "latest" docs, which the page marks as a development version
of Ceph). CRUSH places replicas according to a hierarchy that mirrors
the physical layout (host, chassis, rack, row, PDU, room, datacenter),
and a rule picks which level is the failure domain.

## Key claims

- The CRUSH map mirrors the physical layout so it can model correlated failures. "By reflecting the underlying physical organization of the installation, CRUSH can model (and thereby address) the potential for correlated device failures." (CRUSH Maps)
- Shared power, networking, racks all matter. "Some factors relevant to the CRUSH hierarchy include chassis, racks, physical proximity, a shared power source, shared networking, and failure domains." (CRUSH Maps)
- Replicas on different shelves, racks, power supplies, controllers or places. "it might be desirable to ensure that data replicas are on devices that reside in or rely upon different shelves, racks, power supplies, controllers, or physical locations." (CRUSH Maps)
- Default: replicas go on different hosts. "ensures that replicas or erasure-code shards are distributed across hosts and that the failure of a single host or other kinds of failures will not affect availability." (CRUSH Maps)
- Bigger clusters usually spread over racks. "For example, distributing replicas across racks is typical for mid- to large-sized clusters." (CRUSH Maps)
- Default bucket types. "By default, valid CRUSH types include root, datacenter, room, row, pod, pdu, rack, chassis, and host." (CRUSH Location)
- The full default type list, bottom to top: osd, host, chassis, rack, row, pdu, pod, room, datacenter, zone, region, root. (Types and Buckets)
- Choosing the failure domain is the key decision for a rule. "if you select a failure domain of host, then CRUSH will ensure that each replica of the data is stored on a unique host." (Creating a rule for a replicated pool)

## Visuals worth redrawing

- A CRUSH hierarchy as a tree: root, row, rack, host, OSD.

## My notes

- A concrete example of a failure-domain hierarchy written down as
  config, rather than as a cloud provider's marketing term.
