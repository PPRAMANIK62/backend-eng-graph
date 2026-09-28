---
id: network-latency
title: Network latency
depth: deep
phase: 2
note: >-
  Propagation, transmission, queuing and processing delay. Round-trip
  time, and why the speed of light is a real limit.
needs: [network-layers, latency-numbers]
leads_to: [bandwidth-delay-product, bufferbloat]
compare_with: []
updated: 2026-09-29
---

# Network latency

Network latency is the time a packet takes to get from one machine to
another. On a single machine almost everything takes under a
millisecond; across a network a single round trip can take hundreds
(the phase 1 [[latency-numbers]] table has both). Knowing which parts of
that time you can shrink, and which are set by physics, tells you
where to put servers, how many round trips a request can afford, and
why a faster link often doesn't help.

## One packet, four delays

Follow one packet from a server in New York to a client in London. At
every router on the way, it pays four kinds of delay:

1. **Processing.** The router reads the packet's headers (the
   network-layer part of the stack, see [[network-layers]]), checks for
   bit errors, and looks up where to send it. Modern routers do most
   of this in hardware, so it's small, but not zero.
2. **Queuing.** If packets are arriving faster than the outgoing link
   can send them, this one waits in a buffer behind the others. It can
   be zero or it can grow large, and it changes from moment to moment.
3. **Transmission.** The time to push all the packet's bits onto the
   link. It depends on the packet's size and the link's rate, and not
   at all on distance.
4. **Propagation.** The time for the signal to travel down the wire or
   fibre to the next router. It depends on distance and the speed of
   the signal, and not at all on packet size or link rate.

The one-way latency is the sum of all four, at every hop. The
**round-trip time** (RTT) is there and back: your packet out, the reply
in. Most things you'll measure, like `ping` or a TCP handshake, report
round trips.

![One hop drawn as a timeline. A packet arrives at a router, spends a short time in processing, waits in a queue, is transmitted bit by bit onto the link, then propagates along the fibre to the next router. Labels say what each delay depends on: processing on the router, queuing on the load, transmission on packet size divided by link rate, propagation on distance divided by signal speed.](img/network-latency-four-delays.svg)

*The four delays a packet pays at each hop. Adapted from the latency components in Ilya Grigorik, "Primer on Latency and Bandwidth" (High Performance Browser Networking, 2013).*

## Propagation: the speed of light in glass

Light in a vacuum travels about 300,000 km per second. Long-distance
links are optical fibre, and light in fibre is slower: glass has a
refractive index of about 1.4 to 1.6. The rule of thumb is 1.5, which
puts light in fibre at about 200,000 km per second, two thirds of its
vacuum speed.

That gives you a floor for any route. New York to London is 5,585 km
along the shortest path over the Earth's surface. In fibre that's
28 ms one way and 56 ms for a round trip, and that's with a straight
cable, no routers and no waiting. New York to Sydney, 15,993 km, is 160
ms round trip at best.

| Route | Distance | Round trip in fibre, straight line |
|---|---|---|
| New York to San Francisco | 4,148 km | 42 ms |
| New York to London | 5,585 km | 56 ms |
| New York to Sydney | 15,993 km | 160 ms |

*From Table 1-1 of Grigorik (2013).*

Real paths are longer than a straight line. Cables don't run straight,
and packets go wherever routing sends them (see [[ip-routing]]). A 2014
study that traced paths from 400+ well-connected test machines
(PlanetLab nodes) to 28,000 popular websites found:

- Fibre runs between the same two points were usually 1.5 to 2 times
  the road distance.
- The route through the routers, in the median, was 2.3 times the
  straight-line light time. Of that, 1.5 is just glass being slower
  than a vacuum. The rest is the route being longer.
- Some paths went badly out of the way. Packets between eastern China
  and Taiwan were seen going via California.
- The minimum ping time was 3.2 times the straight-line light time.

In practice New York to Sydney is 200 to 300 ms, not 160. An older
check gives the same picture: in 1996 a ping from Stanford to Boston,
4,320 km apart, took about 85 ms, against a straight-line floor of
43 ms in fibre.

No engineering removes the floor. You can only move the endpoints
closer. That's the whole idea behind putting servers, caches and CDNs
near users, and behind choosing a region near your database.

## Transmission: why a faster link doesn't help small messages

Transmission time is size divided by rate. Network rates are in
**bits** per second, file sizes usually in **bytes**, so multiply by 8
first: a 10 MB file is 80 Mb, and takes 80 seconds on a 1 Mbps link.

For small packets on fast links it's tiny. A 1,500-byte packet is
12,000 bits; on a 1 Gbps link that's 12 µs to put on the wire (simple
arithmetic, not a measurement). Compare that with the milliseconds of
propagation above.

So for most backend traffic, requests and responses of a few kilobytes,
the link rate barely matters and the distance matters a lot. An old
example makes the point: sending ten characters over a 33 kbit/s modem
took 2.4 ms of transmission but 102.4 ms in total, because the modems
added 100 ms of fixed latency. You can buy more bandwidth by running
links in parallel. You can't buy less latency that way.

Transmission does matter for big transfers, and for slow links like a
home uplink. It's also how queuing starts, below.

## Queuing: the delay that moves

Queues form where a fast link feeds a slow one, or where many links
merge into one: a fast Ethernet link feeding a slow DSL uplink, say.
Packets that arrive faster than the slow link can send them wait in its
buffer.

Some queue is good. Traffic comes in bursts, and a buffer that absorbs
a burst and drains within about one round trip keeps the link busy
without adding much delay. The trouble is a **standing queue**, one
that never drains.

The CoDel spec (RFC 8289, 2018) has a clean example. A TCP connection
keeps 25 packets in flight, but the path only holds 20 (its
[[bandwidth-delay-product]]). The extra 5 sit in the bottleneck's buffer
for as long as the connection runs, adding delay to every packet and doing nothing for
throughput. Give the connection a 30-packet window and the queue grows
to 10, with the same sending rate. The queue size tells you nothing
about how fast data is moving. It only adds delay.

[[bufferbloat|Bufferbloat]] is the name for this at scale. As memory got cheap,
routers and modems shipped with bigger and bigger buffers, meant to
avoid dropping packets at all costs. That breaks the way TCP's
[[congestion-control]] backs off, and it adds high, variable delay:
the buffer fills, and every packet waits behind it. It's worst at the
consumer edge, where home connections meet the internet.

The fix is active queue management: drop packets early, based on how
long they've waited in the buffer rather than how many are in it. CoDel
aims to keep the standing delay near a 5 ms target, with a 100 ms
window, settings chosen for the ordinary internet. Linux has shipped
CoDel since 3.5.

You can see queuing in your own numbers. In the phase 1 experiment,
pinging the home router over Wi-Fi took 1.7 ms at best and 32.9 ms at
worst over 50 pings
([experiment 0001](../../experiments/0001-latency-numbers-on-my-laptop.md)).
The distance didn't change. What made the difference wasn't measured;
queuing and Wi-Fi itself are both suspects.

## Round trips add up

One request is rarely one round trip. Before your first byte of
response arrives, a new connection may need a [[dns]] lookup, a
[[tcp-handshake]], a TLS handshake, and then TCP starting slowly while
it probes the path. Each can cost a round trip or more.

The same 2014 study broke this down. Fetching just the HTML of a
landing page took, in the median, 34 times the straight-line light
time, and 169 times at the 90th percentile. DNS was 5.4 times, and the
transfer 8.7 times, mostly TCP's slow start on a small response. The
physics was a small part; round trips and roundabout paths were most of
it.

The **last mile** is its own cost. The connection from a home to the
ISP's network adds latency before a packet reaches anything like a
backbone. The US regulator's broadband measurements, as summarised in
2013, put it at 10 to 20 ms for fibre, 15 to 40 ms for cable and 30 to
65 ms for DSL, before the packet has left the ISP.

## Where it gets tricky

**Is it the buffers or the route?** The bufferbloat work treats full
buffers at the edge as a major cause of delay. The 2014 study found
that on its well-connected paths, bufferbloat explained little; long
routes and protocol round trips did. It also found that, at the edge,
the average RTT between a server and a user was 1.9 times the minimum
in the median, about 30 ms more, and named bufferbloat as a suspect
there. Both can be true: the answer depends on whether you measure
from a datacenter or from someone's Wi-Fi.

**Latency is directional.** The two directions can differ. In Azure's
published numbers, East US to East US 2 is 8 ms and the
reverse is 9 ms. A round trip hides that.

**Bandwidth gets blamed for latency.** Slow pages and slow APIs often
come from round trips, not throughput. A faster plan does nothing for a
request that makes five sequential calls across an ocean.

**Medians hide the queue.** Propagation is fixed for a given path.
Queuing isn't, so it shows up as the gap between your fastest round
trips and your typical or slowest ones, like the router ping above. A
service whose median is fine and whose tail is terrible may be waiting
in a queue, in the network or in your own code.

**Ping is not your request.** A ping measures one small round trip. Your
request pays extra round trips, TCP's slow start, and the server's own
work on top.

## What this means when you build

- Estimate with the floor: distance ÷ 200,000 km/s, doubled for a round
  trip. Real paths are slower, often by 2 to 3 times.
- Count round trips per request, then multiply by the RTT. Cut round
  trips before you tune anything else: reuse connections, batch calls,
  and run independent calls in parallel.
- Put the server near the data, and the data near the users. It's the
  only lever on propagation.
- Measure the tail. A median RTT hides queuing.
- Measure latency direction by direction when it matters, and write
  down where you measured from. Cloud backbone numbers (Azure's East
  US to West US is 69 ms in its July 2026 data) aren't what a user on
  home Wi-Fi sees.

## Further reading

- [Primer on Latency and Bandwidth](https://hpbn.co/primer-on-latency-and-bandwidth/), Ilya Grigorik, 2013. The four delays, the speed of light in fibre with a table of real routes, and last-mile latency. The clearest single introduction.
- [The Internet at the Speed of Light](http://conferences.sigcomm.org/hotnets/2014/papers/hotnets-XIII-final111.pdf), Ankit Singla, Balakrishnan Chandrasekaran, P. Brighten Godfrey and Bruce Maggs, 2014. How far real latency is from the physical limit, and which layer adds what.
- [RFC 8289: Controlled Delay Active Queue Management](https://www.rfc-editor.org/rfc/rfc8289), K. Nichols, V. Jacobson et al., 2018. Where queues form, good queue vs bad queue, and how CoDel keeps delay down.
- [It's the Latency, Stupid](http://www.stuartcheshire.org/rants/latency.html), Stuart Cheshire, 1996. The classic argument that bandwidth can be bought and latency can't, with a worked speed-of-light example.
- [Azure network round-trip latency statistics](https://learn.microsoft.com/en-us/azure/networking/azure-network-latency), Microsoft Learn, 2026. Measured median round trips between cloud regions, and the fact that latency is directional.
