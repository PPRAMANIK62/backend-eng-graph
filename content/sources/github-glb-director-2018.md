---
id: github-glb-director-2018
title: "GLB: GitHub’s open source load balancer"
author: Theo Julienne (GitHub)
url: https://github.blog/engineering/infrastructure/glb-director-open-source-load-balancer/
kind: blog
primary: true
---

## Summary

GitHub's layer 4 load balancer design (2018). Starts from ECMP and why
it breaks connections, then LVS-style directors with connection state,
then GLB's stateless director: a fixed table of primary and secondary
servers per hash bucket, built with rendezvous hashing, where a server
that doesn't know a packet's connection passes it to the secondary.

## Key claims

- GLB Director is an L4 load balancer that sits in front of haproxy and nginx. "GLB Director does not replace services like haproxy and nginx, but rather is a layer in front of these services (or any TCP service)" (opening and "Scaling an IP using ECMP")
- The basic L4 property: one IP, many servers. "The basic property of a Layer 4 load balancer is the ability to take a single IP address and spread inbound connections across multiple servers." (opening and "Scaling an IP using ECMP")
- The balancers themselves must scale too. "This is essentially another layer of load balancing." (opening and "Scaling an IP using ECMP")
- ECMP hashes the addresses and ports so one connection's packets take one path. "typically it’s a consistent hash based on the source and destination IP address as well as the source and destination port for TCP traffic." (Scaling an IP using ECMP)
- Using ECMP to shard across servers breaks connections when the set changes, because routers are stateless. "Routers are typically stateless devices, simply making the best decision for each packet without consideration to the connection it is a part of, which means some connections will break in this scenario." (Scaling an IP using ECMP)
- LVS directors store which backend each connection went to; a new director without that state may send packets wrong. (Split director/proxy load balancer design)
- GLB picks a primary and secondary server per connection; a packet the primary doesn't recognise goes to the secondary. "Essentially this gives packets a “second chance” at arriving at the expected server that holds their state." (Removing all state from the director tier)
- The table has 65k rows of primary/secondary pairs, about 512 KB. "we instead use some indirection by creating a table (65k rows), with each row containing a primary and secondary server IP address." (Maintaining invariants: rendezvous hashing)
- The order per row comes from rendezvous hashing. "Rendezvous hashing is an ideal choice, since it can trivially satisfy these invariants." (Maintaining invariants: rendezvous hashing)
- Draining swaps primary and secondary so new connections go elsewhere while old ones finish. "This has the effect of draining the desired server of connections gracefully" (Draining, filling, adding and removing proxies)
- GLB moved from Foo-over-UDP with GRE to GUE encapsulation. "We recently transitioned to Generic UDP Encapsulation (GUE)" (Encapsulation within the datacenter)
- Replies go straight to the client (Direct Server Return). "it can be sent directly to the client (often called “Direct Server Return”)." (Encapsulation within the datacenter)

## Visuals worth redrawing

- ECMP rehash breaking one third of connections when a server is added.

## My notes

- Only one proxy may be draining or filling at a time in this design.
