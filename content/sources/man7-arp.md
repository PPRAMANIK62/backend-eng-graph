---
id: man7-arp
title: arp(7), Linux manual page
author: man-pages contributors
url: https://man7.org/linux/man-pages/man7/arp.7.html
published: 2026-02-08
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The Linux man page for the kernel's ARP module (man-pages 6.19). The
neighbor cache, how entries go stale and get re-probed, and the
/proc/sys/net/ipv4/neigh tunables with their defaults.

## Key claims

- ARP maps link-layer (hardware) addresses to IPv4 addresses on directly connected networks. "It is used to convert between Layer2 hardware addresses and IPv4 protocol addresses on directly connected networks." (DESCRIPTION)
- The kernel keeps a limited-size cache and garbage-collects old entries. "The cache has a limited size so old and less frequently used entries are garbage-collected." (DESCRIPTION)
- Entries go stale without positive feedback, e.g. a TCP ACK. "Positive feedback can be gotten from a higher layer; for example, from a successful TCP ACK." (DESCRIPTION)
- Re-probing tries unicast to the old MAC first, then broadcast, and only when there's data to send. "If that fails too, it will broadcast a new ARP request to the network.  Requests are sent only when there is data queued for sending." (DESCRIPTION)
- A found neighbor stays valid for a random time around base_reachable_time; default 30 s. "Defaults to 30000 milliseconds." (base_reachable_time_ms, since Linux 2.6.12)
- gc_thresh3 is the hard maximum, default 1024. "The hard maximum number of entries to keep in the ARP cache." (gc_thresh3)
- gc_thresh1 default 128, gc_thresh2 default 512. (gc_thresh1, gc_thresh2)
- Only a few packets queue per unresolved address. "The maximum number of packets which may be queued for each unresolved address by other network layers.  Defaults to 3." (unres_qlen)
- mcast_solicit: broadcast attempts before marking unreachable, default 3. (mcast_solicit)
- Linux ARP reuses the IPv6 neighbor discovery algorithms. "Linux 2.2+ IPv4 ARP uses the IPv6 algorithms when applicable." (SEE ALSO)

## Visuals worth redrawing

None.

## My notes

- `ip neigh` (ip-neighbour(8)) shows the cache; not cited.
- The page says these are per-interface under /proc/sys/net/ipv4/neigh/<dev>/.
