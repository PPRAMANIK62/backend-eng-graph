---
id: cloudflare-unimog-2020
title: "Unimog - Cloudflare’s edge load balancer"
author: David Wragg (Cloudflare)
url: https://blog.cloudflare.com/unimog-cloudflares-edge-load-balancer/
kind: blog
primary: true
---

## Summary

Cloudflare's layer 4 load balancer inside each edge data centre (2020).
Why L4, what it can and can't do compared with L7, why ECMP alone
wasn't enough, and how every server forwards packets for connections it
doesn't own, using XDP and a table built from measured server load.

## Key claims

- The job: servers go in and out of service, and load must be spread. "servers should only receive connections when they are in operation." (The role of Unimog in our edge network)
- Balancing moves load, it doesn't remove it. "for the load on one server to go down, the load on some other server must go up" (The role of Unimog in our edge network)
- An L4LB inspects packets up to layer 4 of the OSI model. "L4LBs direct packets on the network by inspecting information up to layer 4 of the OSI network model, which distinguishes them from the more common Layer 7 Load Balancers." (How Unimog compares to other load balancers)
- It's cheap because it never processes the payload. "They direct packets without processing the payload of those packets, so they avoid the overheads associated with higher level protocols." (How Unimog compares to other load balancers)
- It can only decide which server gets a connection, and can't take part in TLS or HTTP; L7 balancers are proxies. "The downside of L4LBs is that they can only control which connections go to which servers." (How Unimog compares to other load balancers)
- L7 balancers act as proxies. "Layer 7 Load Balancers act as proxies, so they can modify data on the connection and participate in those higher-level protocols" (How Unimog compares to other load balancers)
- L4LBs are used where L7 alone can't scale: Maglev, Katran, GLB. "They are mostly used at companies which have scaling needs that would be hard to meet with L7LBs alone." (How Unimog compares to other load balancers)
- Equal connection counts don't give equal load on mixed hardware, so Unimog measures load and adjusts with a control loop. "it takes regular measurements of the load on each of our servers, and uses a control loop that increases or decreases the number of connections going to each server" (How Unimog compares to other load balancers)
- One data center often holds several server models, so equal connection counts mean unequal load. "It’s not unusual for a single data center to contain a mix of server models, due to expansion and upgrades over time." (How Unimog compares to other load balancers)
- A connection is identified by the 4-tuple, spanning the layer 3 and layer 4 headers. "Collectively, these four fields are known as the 4-tuple." (Refresher: TCP connections)
- One misdirected packet breaks a TCP connection with a RST. "So a misdirected packet is much worse than a dropped packet." (Refresher: TCP connections)
- ECMP alone breaks connections when servers change, has group size limits and no dynamic weights. "These changes cause rehashing events, which break connections to all the servers in an ECMP group." (Forwarding packets)
- Unimog costs under 1% of CPU. "Our measurements show that Unimog costs less than 1% of the processor utilization, compared to a scenario where no load balancing is in use." (XDP and xdpd)
- Encapsulation grows packets: 1500 becomes 1536 bytes with GUE, so jumbo frames are used inside. "For Unimog, encapsulating a 1500-byte packet results in a 1536-byte packet." (Encapsulation)
- Encapsulation keeps the original packet, addresses included, intact for the server. "The DIP is then used as the destination address in the outer headers, but the addressing information in the headers of the original packet is preserved." (Encapsulation)
- Load balancers must agree on forwarding without talking to each other, so they hash the 4-tuple into a table. "Instead L4LBs adopt designs which allow the load balancers to reach consistent forwarding decisions independently." (Forwarding logic)

## Visuals worth redrawing

- The router -> any server -> owning server forwarding picture.

## My notes

- Heavily influenced by GitHub's GLB (reuses glb-redirect).
