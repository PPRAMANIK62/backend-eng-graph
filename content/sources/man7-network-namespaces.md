---
id: man7-network-namespaces
title: network_namespaces(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/network_namespaces.7.html
kind: docs
primary: true
---

## Summary

The short man page for network namespaces (man-pages 6.19): what they
isolate, and veth pairs as the way to connect one namespace to another.

## Key claims

- What is isolated: devices, IPv4 and IPv6 stacks, routing tables, firewall rules, port numbers. "Network namespaces provide isolation of the system resources associated with networking: network devices, IPv4 and IPv6 protocol stacks, IP routing tables, firewall rules" (DESCRIPTION)
- A physical device lives in exactly one namespace. "A physical network device can live in exactly one network namespace." (DESCRIPTION)
- veth pairs connect namespaces like a pipe. "A virtual network (veth(4)) device pair provides a pipe-like abstraction that can be used to create tunnels between network namespaces" (DESCRIPTION)
- veth devices inside a freed namespace are destroyed. "When a namespace is freed, the veth(4) devices that it contains are destroyed." (DESCRIPTION)

## Visuals worth redrawing

None.

## My notes

- The worked `ip netns` example is in lwn-network-namespaces-2014.
