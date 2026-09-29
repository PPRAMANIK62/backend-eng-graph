---
id: load-balancing
title: Load balancing
depth: deep
phase: 3
note: >-
  Spreading requests across many copies of a service so none is
  overloaded and dead ones get skipped.
needs: [reverse-proxy]
leads_to: [l4-vs-l7, load-balancing-algorithms, health-checks, service-discovery, graceful-shutdown, cascading-failures, deployment-strategies, service-mesh]
compare_with: []
---

# Load balancing

Load balancing is how traffic for one service gets spread over many
copies of it. Something between the client and the copies decides, for
every connection or request, which copy gets it. Done well, you can add
servers to add capacity, lose a server without an outage, and deploy
new code one machine at a time. Done badly, one server melts while the
others sit half idle.

## One name, many servers

Start with a service called `api` that runs as three copies, each on
its own machine. A client wants to call `api`. Something has to turn
that one name into one of three machines, and keep doing it as
machines come and go. That something is the load balancer, and it has
three jobs:

- **Skip backends that can't serve.** A crashed, restarting or
  overloaded copy shouldn't get new work. How it finds out is
  [[health-checks]].
- **Keep together what belongs together.** Every packet of one [[tcp|TCP]]
  connection has to reach the same machine, or the connection breaks.
- **Spread the work evenly.** Not the number of requests, the actual
  work.

The last one matters more than it sounds. You can only send a service
more traffic until its busiest copy is full. Every copy that's less
busy than that is holding capacity you're paying for and can't use.
Reserve 1,000 CPUs for a service with uneven load across its copies,
and you may only be able to use about 700 of them. That's why balancing
quality shows up in the hardware bill.

## Where the decision gets made

A request to a big service usually passes through several balancers,
each working at a different level. You'll meet all of them.

![Four stages from a client to a backend. First, DNS returns one of several addresses. Second, a router spreads packets for a virtual IP across several layer 4 balancer machines with ECMP, and each balancer forwards a whole connection to one proxy. Third, layer 7 proxies read each HTTP request and pick a backend per request. Fourth, the backends. A separate path shows client-side balancing, where a client library picks a backend for each call itself, with no balancer in between.](img/load-balancing-layers.svg)

*The levels where a balancing decision can be made. Large sites stack them. Adapted from Piotr Lewandowski, "Load Balancing at the Frontend" (Google SRE book, 2017), and Theo Julienne, "GLB: GitHub's open source load balancer" (2018).*

**DNS.** The first chance to balance is before a connection even
exists. The [[dns]] server returns several A or AAAA records for one
name and the client picks one. It's simple and gives you very little
control: each address gets a roughly equal share, and answers are
cached by resolvers for the record's TTL, so a change reaches users
only as fast as those caches expire ([[dns-caching]]). Some resolvers
don't respect the TTL at all. DNS is good for sending users to a
nearby datacenter, not for fine-grained balancing inside one.

**A network balancer at a virtual IP.** The address DNS hands out is
often a virtual IP (VIP): an address not tied to one machine, served
by a pool of balancers. Routers spread the VIP's packets across the
balancer machines using ECMP (equal-cost multipath), which hashes each
packet's addresses and ports so that one connection's packets take one
path. Each balancer then picks a backend for the connection and
forwards its packets there, usually by wrapping each packet in another
IP header (GRE in Google's Maglev, GUE in GitHub's GLB and Cloudflare's
Unimog). The backend unwraps it and replies to the client directly, so
the balancer only handles the small incoming half of the traffic. This
is called direct server return. Maglev's VIPs are announced to routers
with [[bgp]]. These balancers look at packet headers only, which is
what "layer 4" means; the difference from "layer 7" is
[[l4-vs-l7]].

**A proxy that reads requests.** Behind the L4 tier there's usually a
[[reverse-proxy]] such as nginx, HAProxy or Envoy. It ends the client's
TCP (and [[tls|TLS]]) connection, reads each HTTP request, and picks a backend
per request. GitHub's GLB, for example, sits in front of their haproxy
and nginx machines, so it's L4 first, then L7.

**The client itself.** Inside a datacenter, the balancer is often a
library in the calling service. Google's RPC clients hold connections
to many backends and pick one per request. gRPC works the same way: a
resolver hands the client a list of addresses and a pluggable policy
picks a server for each call. Watch the default, though. gRPC's default
policy, `pick_first`, connects to the first address that works and
sends every call there. You have to ask for `round_robin` or something
smarter to get any spreading at all.

Each level has the same three jobs. They differ in what they can see
and how often they decide: per DNS lookup, per connection, or per
request.

## A connection has to stay where it started

A network balancer can't just send each packet to the least busy
server. The first packet of a TCP connection sets up state on one
backend. If a later packet lands on a different backend, that machine
knows nothing about the connection and answers with a reset, and the
client sees an error. One misdirected packet does more damage than a
dropped one, because TCP retransmits a dropped packet but can't
recover a connection that was reset.

The obvious fix is to hash the connection's addresses and ports and
take the result modulo the number of backends. Every balancer computes
the same answer with no shared state. It falls apart the moment the
number of backends changes: with `hash mod N` becoming `hash mod N-1`,
almost every connection maps to a different backend, and almost every
open connection breaks.

Real L4 balancers combine two things:

- **A connection table.** The first time a balancer sees a connection,
  it records which backend it chose, and later packets follow the
  table. Maglev keys its table on a hash of each packet's 5-tuple.
- **Consistent hashing** for when the table doesn't help. If the set of
  balancer machines changes, ECMP reshuffles connections onto balancers
  that have no table entry for them. The table can also fill up under a
  SYN flood. A consistent hash moves only a small share of connections
  when a backend is added or removed, so most still land in the right
  place even without the table. How those hashes are built is part of
  [[load-balancing-algorithms]].

GitHub's GLB takes a third route: every hash bucket names a primary
and a secondary server. If the primary gets a packet for a connection
it doesn't know, it passes it to the secondary, which gives packets a
second chance to find the server that holds their state.

## Equal requests aren't equal work

Suppose every copy gets exactly the same number of requests. It still
won't get the same load, and Google ran into every one of these
reasons:

- **Requests cost different amounts.** In many Google services the most
  expensive requests use 1,000 times or more the CPU of the cheapest.
  One Java backend averaged about 15 ms of CPU per query, but some
  queries needed up to 10 seconds.
- **Machines differ.** A datacenter holds several generations of
  hardware. Cloudflare runs a mix of server models in one data centre,
  so equal connection counts give unequal CPU use.
- **Neighbours interfere.** Other processes on the same machine compete
  for caches and bandwidth. Google has seen differences of up to 20%
  from this alone.
- **Restarts are expensive.** A freshly started task often needs much
  more CPU for a few minutes while it warms up.

That's why plain round robin, which gives every copy the same count,
left up to a 2x spread in CPU between Google's least and most loaded
tasks. The fixes all feed the balancer better information: count
requests still in flight, have backends report their utilization, or
measure load and adjust shares in a feedback loop, as Unimog does for
connections. The trade-offs between them are
[[load-balancing-algorithms]].

## Taking backends out, on purpose and not

The balancer also needs to know who can serve. Some of that comes from
probing and from watching errors ([[health-checks]]), and the list of
backends itself comes from [[service-discovery]].

Planned removals deserve their own care. Google's servers use a "lame
duck" state: when the job scheduler sends SIGTERM (see [[signals]]),
the server stays up and keeps answering, but tells its clients to stop
sending new requests. Requests already in flight finish, the active
count drains to zero, and only then does the process exit. Their rule
of thumb for the drain is 10 to 150 seconds, depending on the clients.
Deploys then stop failing the requests that happened to be running
when a server shut down.

## Not every client needs every backend

Client-side balancing has a scaling problem. Each connection costs
memory and health-checking work at both ends. With thousands of client
tasks and thousands of backends, everyone connected to everyone wastes
a lot for little gain. Google limits each client to a subset of
backends, typically 20 to 100.

How you choose the subset matters. With random subsets, Google
calculated that for 300 clients each connected to 90 of 300 backends,
the least loaded backend would get 63% of the average number of
connections and the busiest 121%. With 30 backends per client the
spread grew to 50% and 150%. A deterministic scheme that shuffles the
backend list and hands out slices in rounds gave every backend the same
number of clients.

## Where it gets tricky

**The balancer can become the thing that fails.** Hardware balancers
are usually deployed in pairs, which only gives 1+1 redundancy, and
each pair caps out at one box's capacity. Software balancers spread
over many machines with ECMP scale out and give N+1 redundancy.
Google, GitHub and Cloudflare each built their own in software.

**Health checks can take out too much.** If a bug or an overload makes
most backends look unhealthy, removing all of them sends the whole load
to the few left, which then fail too. Envoy has a panic threshold for
this: when fewer than 50% of hosts (the default) look available, it
ignores health status and spreads traffic over all hosts, or, if you
configure it that way, fails everything. Google saw
the opposite trap with its simple cap on active requests per backend:
it once marked every backend unreachable at the same time.

**Long-lived connections defeat connection-level balancing.** An L4
balancer decides once per connection. If a client opens one
connection and sends everything over it, as [[http2]] and [[grpc]]
clients do, all its requests land on one backend. More in
[[l4-vs-l7]].

**Wrapping packets makes them bigger.** GRE adds 24 bytes to an IPv4
packet; GUE turns a 1,500-byte packet into 1,536 bytes. Past the
network's MTU that means fragmentation or drops (see
[[mtu-and-fragmentation]]), so these networks raise the MTU inside
the datacenter.

**DNS changes are slow and imprecise.** A resolver serves thousands of
users with one cached answer, and you can't flush it, so DNS balancing
reacts only as fast as the TTL, and sometimes slower.

## What this means when you build

- Know every level that balances your traffic (DNS, L4, proxy, client
  library) and what each one decides per connection or per request.
- Check your client library's default. gRPC's `pick_first` doesn't
  spread calls at all.
- Plan for uneven work: count in-flight requests or use backend load,
  not only request counts.
- Drain before you stop a server: stop taking new work, finish what's
  in flight, then exit.
- Put a floor under health-based removal, so a bad check can't empty
  the pool.
- With many clients and backends, use subsets, and pick them
  deterministically.

## Further reading

- [Load Balancing at the Frontend](https://sre.google/sre-book/load-balancing-frontend/), Piotr Lewandowski, Google SRE book chapter 19, 2017. DNS balancing, virtual IPs, why `hash mod N` breaks, and how packets get forwarded.
- [Load Balancing in the Datacenter](https://sre.google/sre-book/load-balancing-datacenter/), Alejandro Forero Cuervo, Google SRE book chapter 20, 2017. Why equal requests aren't equal load, lame duck draining, and subsetting, with Google's numbers.
- [Maglev: A Fast and Reliable Software Network Load Balancer](https://research.google.com/pubs/archive/44824.pdf), Eisenbud et al., Google, NSDI 2016. How a software L4 balancer keeps connections on one backend with connection tracking plus consistent hashing.
- [Unimog - Cloudflare's edge load balancer](https://blog.cloudflare.com/unimog-cloudflares-edge-load-balancer/), David Wragg, Cloudflare, 2020. An L4 balancer that measures server load, and why one misdirected packet breaks a connection.
- [GLB: GitHub's open source load balancer](https://github.blog/engineering/infrastructure/glb-director-open-source-load-balancer/), Theo Julienne, GitHub, 2018. From ECMP to a stateless director with a "second chance" server per connection.
- [Load Balancing in gRPC](https://github.com/grpc/grpc/blob/master/doc/load-balancing.md), gRPC project docs. Client-side balancing per call, and the `pick_first` default.
- [Panic threshold](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold), Envoy docs (1.40.0-dev). What a proxy does when too many backends look unhealthy.
