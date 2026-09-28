---
id: bgp
title: BGP
depth: short
phase: 2
note: >-
  How networks on the internet announce which addresses they can
  reach, and why a bad announcement can take a service offline.
needs: [ip-routing]
leads_to: [anycast]
compare_with: []
updated: 2026-09-29
---

# BGP

The Internet is a network of independent networks, and BGP (Border
Gateway Protocol, version 4, RFC 4271, 2006) is how they tell each other
which addresses they can reach. It fills the routing tables that every
packet crossing the Internet is forwarded by. You'll probably never
configure it, but when it goes wrong, whole companies vanish from the
Internet, and your service can be one of them.

## Networks announce what they can reach

Each independent network is an **autonomous system** (AS): a set of
routers run by one organization that looks, from outside, like one
network with one routing plan. Each AS has a number (an ASN). An AS can
**originate** a prefix ("these addresses are mine") and can **transit**
other networks' prefixes ("I know how to reach those").

Two neighboring ASes run a BGP session over a TCP connection on port 179,
so BGP gets reliable delivery for free. At the start they exchange their
routes. After that they only send changes: an UPDATE message announces a
new route or withdraws an old one. There's no periodic refresh of the whole
table, only KEEPALIVE messages to show the session is alive.

Each announcement carries the **AS path**, the list of ASes the route has
passed through. When an AS passes a route on to another AS, it adds its own number to
the front.

![Four autonomous systems. AS1 owns 203.0.113.0/24 and announces it to AS2 with the path "AS1". AS2 passes it to AS3 with the path "AS2 AS1". AS3 passes it to AS4 with "AS3 AS2 AS1". AS4 also hears the route from AS1 directly over a second link, with the path "AS1". A note says that a route arriving at AS1 with AS1 already in its path is rejected as a loop.](img/bgp-as-path.svg)

*An announcement spreading outward, growing its AS path at each step.*

The AS path does two jobs. It stops loops: if an AS sees its own number in
a path, it rejects that route. And it's one of the inputs for choosing
between routes.

## Choosing a route is policy first

When an AS hears several routes to the same prefix, it doesn't pick the
fastest. It first applies its own policy: each network's operators configure
which routes they prefer, for their own reasons. Only among equally
preferred routes does the shortest AS path win, and more tie-breakers
follow after that.

The winner goes into the routing table, where ordinary
[[ip-routing|longest prefix match]] takes over. That detail matters: a
more specific prefix beats a shorter one, whichever AS announced it.

## Where it gets tricky

**BGP believes what it's told.** The security section of RFC 4271 only
protects the TCP session between two routers. Nothing in the base
protocol checks that an AS is allowed to announce a prefix. On 2019-06-24
an ISP's "BGP optimizer" in Pennsylvania split prefixes into more-specific halves,
turning Cloudflare's `104.20.0.0/20` into two /21s. Those leaked through a
customer to Verizon, which announced them to the whole Internet. Because
more specific routes win, traffic for Cloudflare, Amazon and others headed
into networks that couldn't carry it. At the worst point Cloudflare lost
about 15% of its global traffic. The fixes Cloudflare called for were a
limit on how many prefixes a session will accept, filtering against the
Internet Routing Registry, and RPKI: the owner signs which AS may
originate its prefixes and the maximum prefix length, and receiving
networks drop anything that doesn't fit. RPKI only helps where networks
turn on origin validation.

**Withdrawing your own routes is just as fatal.** On 2021-10-04, Facebook
withdrew the BGP routes to the prefixes holding its DNS servers. Cloudflare
saw a burst of Facebook routing changes around 15:40 UTC and the DNS routes
gone by 15:58 UTC. With no route to the name servers, resolvers everywhere
answered SERVFAIL, and retries pushed resolver load to about 30 times
normal. facebook.com didn't resolve on Cloudflare's 1.1.1.1 from about
15:50 to 21:20 UTC. Facebook's other addresses were still routed but useless
without [[dns|DNS]].

**The protocol keeps changing.** RFC 4271 has 12 updates, including
four-byte AS numbers (RFC 6793) and a change to what external sessions do when no
policy is configured (RFC 8212).

## What this means when you build

- Your service is reachable only while someone announces a route to its
  addresses. That's usually your cloud or hosting provider; know who it is.
- Keep your DNS servers, or a secondary DNS provider, outside the network
  they describe, so a routing failure doesn't take your names down too.
- Watch reachability from outside your own network. A BGP problem looks
  fine from inside.
- Announcing one prefix from many places is how [[anycast]] works.

## Further reading

- [RFC 4271: A Border Gateway Protocol 4 (BGP-4)](https://www.rfc-editor.org/rfc/rfc4271), Y. Rekhter, T. Li, S. Hares (eds.), 2006. The protocol: sessions over TCP, UPDATE messages, AS paths, loop detection and route selection.
- [Understanding how Facebook disappeared from the Internet](https://blog.cloudflare.com/october-2021-facebook-outage/), Celso Martinho and Tom Strickx, Cloudflare, 2021. A withdrawal, seen from outside through BGP and DNS data.
- [How Verizon and a BGP Optimizer Knocked Large Parts of the Internet Offline Today](https://blog.cloudflare.com/how-verizon-and-a-bgp-optimizer-knocked-large-parts-of-the-internet-offline-today/), Tom Strickx, Cloudflare, 2019. A route leak step by step, and the filters that would have stopped it.
