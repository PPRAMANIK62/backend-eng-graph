---
id: man7-ip-route
title: ip-route(8), Linux manual page
author: iproute2 developers (original man page by Michail Litvak)
url: https://man7.org/linux/man-pages/man8/ip-route.8.html
published: 2026-08-04
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The man page for `ip route`, the iproute2 tool that reads and changes the
kernel's routing tables. The man7.org rendering (2026-09-09) was built
from the iproute2 git repository as fetched on 2026-08-04; the page's
own footer date is 13 Dec 2012. Used for route types, the table IDs, and
`ip route get`.

## Key claims

- `ip route` edits the kernel's routing tables. "ip route is used to manipulate entries in the kernel routing tables." (DESCRIPTION)
- Route types include unicast, unreachable (ICMP host unreachable, EHOSTUNREACH), blackhole (silent drop, EINVAL), prohibit (ICMP administratively prohibited, EACCES), local and broadcast. "blackhole - these destinations are unreachable. Packets are discarded silently." (Route types)
- A local route loops the packet back to this host. "local - the destinations are assigned to this host. The packets are looped back and delivered locally." (Route types)
- Normal routes go in the main table (ID 254). "By default all normal routes are inserted into the main table (ID 254) and the kernel only uses this table when calculating routes." (Route tables)
- A hidden local table (ID 255) holds routes for this host's own addresses and broadcasts. "It is the local table (ID 255). This table consists of routes for local and broadcast addresses." (Route tables)
- `default` means 0/0 or ::/0. "There is also a special PREFIX default - which is equivalent to IP 0/0 or to IPv6 ::/0." (ip route add, to)
- Lower metric wins. "routes with lower values are preferred." (metric NUMBER)
- `via` gives the next-hop router. "the address of the nexthop router" (via)
- Default scope: global for routes through a gateway, link for directly connected, host for local. "ip assumes scope global for all gatewayed unicast routes, scope link for direct unicast and broadcast routes and scope host for local routes." (scope)
- The proto field records who installed a route (kernel, boot, redirect, ...). "kernel - the route was installed by the kernel during autoconfiguration." (protocol)
- With no proto given, ip assumes "boot", and a routing daemon purges boot routes when it starts. "boot - the route was installed during the bootup sequence.  If a routing daemon starts, it will purge all of them." (protocol)
- `ip route get` shows the route the kernel would really use. "Essentially, get is equivalent to sending a packet along this path." (ip route get)

Added 2026-09-28 (audit) for `ip-routing`:

- The kernel maintains the local table itself. "The kernel maintains this table automatically and the administrator usually need not modify it or even look at it." (Route tables)

## Visuals worth redrawing

None.

## My notes

- "The kernel only uses this table" is true only without policy rules; ip-rule(8) explains the rule list that picks tables.
