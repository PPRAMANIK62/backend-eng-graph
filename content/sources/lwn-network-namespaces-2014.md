---
id: lwn-network-namespaces-2014
title: Network namespaces
author: Jake Edge (LWN.net)
url: https://lwn.net/Articles/580893/
kind: blog
primary: false
---

## Summary

The network namespace part of LWN's namespaces series (2014). A worked
example with `ip netns`: a new namespace has only a down loopback
device, a veth pair connects it to the host, and it still can't reach
the internet until you add a bridge or NAT in the root namespace.

## Key claims

- Network namespaces virtualize the network inside one kernel. "network namespaces partition the use of the network—devices, addresses, ports, routes, firewall rules, etc.—into separate boxes, essentially virtualizing the network within a single running kernel instance." (intro)
- A new namespace has only loopback. "New network namespaces will have a loopback device but no other network devices." (Network namespace configuration)
- veth pairs pass packets from one end to the other. "Packets sent to veth0 will be received by veth1 and vice versa." (Network namespace configuration)
- To reach the internet you need a bridge or NAT in the root namespace. "Alternatively, IP forwarding coupled with network address translation (NAT) could be configured in the root namespace." (Network namespace configuration)
- `ip netns add` keeps the namespace alive with a bind mount under /var/run/netns. "When the ip tool creates a network namespace, it will create a bind mount for it under /var/run/netns" (Basic network namespace management)
- The new loopback device starts down. "1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN" (Basic network namespace management, `ip link list` output)
- A namespace with the network turned off cannot connect out. "By essentially turning off the network inside a namespace, administrators can ensure that processes running there will be unable to make connections outside of the namespace." (Use cases)

## Visuals worth redrawing

Host namespace and a container namespace joined by a veth pair, with a
bridge or NAT on the host side.

## My notes

- Matches man7-network-namespaces. This is the one with commands.
