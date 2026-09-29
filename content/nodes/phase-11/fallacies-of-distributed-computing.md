---
id: fallacies-of-distributed-computing
title: The fallacies of distributed computing
depth: short
phase: 11
note: >-
  The eight assumptions everyone makes about networks, and why each is
  false.
needs: [distributed-system]
leads_to: []
compare_with: []
---

# The fallacies of distributed computing

The fallacies are eight things people assume about the network when they
first build a [[distributed-system|distributed system]]. Every one of them
is false, and each one, believed, becomes a class of bugs. The list is
short enough to keep in your head and use as a checklist when you review a
design.

## The eight

The list, as it came out of Sun Microsystems:

1. The network is reliable.
2. Latency is zero.
3. Bandwidth is infinite.
4. The network is secure.
5. Topology doesn't change.
6. There is one administrator.
7. Transport cost is zero.
8. The network is homogeneous.

It came together in steps. Bill Joy and Tom Lyon collected the first four,
Peter Deutsch added three more, and James Gosling added the eighth.

## What each one costs you

**The network is reliable.** Packets get lost, and IP itself promises
nothing about delivery. [[tcp|TCP]] resends lost data, but it can't help
when a link or a whole group of machines is cut off, which is a
[[network-partitions|network partition]]. Code that assumes every request
gets a reply hangs, or retries forever, or never retries at all.

**Latency is zero.** Every message takes time, set partly by distance, and
light in fibre is slower than in a vacuum. Delay also varies from one packet
to the next, which is jitter. A design that makes ten sequential remote
calls where one would do pays the round trip ten times. See
[[network-latency]].

**Bandwidth is infinite.** Many links carry more traffic than they have
room for. The excess waits in queues, queues add delay and jitter, and full
queues drop packets. The limit you hit is often close to home, like the
last link to a user.

**The network is secure.** Your packets cross networks run by people you
have no relationship with. Encrypt them, with [[tls|TLS]] for example, and
remember that even encrypted traffic leaks its sizes and timing.

**Topology doesn't change.** Routes change, phones switch towers, providers
reroute traffic. You experience it as sudden loss, delay and jitter, and
the protocols that handle rerouting have their own costs.

**There is one administrator.** A request crosses many networks run by
many teams with their own policies. Even inside one operations team, the
person you talk to is often not the one making the change.

**Transport cost is zero.** Moving data costs something, in hardware,
electricity and people. When a protocol doesn't show the cost, someone
else is paying it, or it shows up on a bill later, like cloud storage
that charges more to fetch data than to store it.

**The network is homogeneous.** Links differ in delay, bandwidth and
capacity, and a Wi-Fi hop behaves nothing like a switched Ethernet one. IP
hides the differences, so the layers above have to cope with them.

## Where it gets tricky

**Who wrote it.** The one-page list on Gosling's site credits only
Deutsch. Many retellings say the first four came
from Bill Joy and "Dave Lyon". A network operator writing on the APNIC
blog calls that a common error: it was Tom Lyon. Small, but a nice lesson
in how facts drift when everyone copies everyone.

**It's a starting list, not the whole story.** The eight are all about the
network. They say nothing about [[process-pauses|paused processes]],
[[clock-skew|clocks that disagree]], or nodes that crash and come back,
which cause just as many bugs.

**"False" doesn't mean "usually false".** Most of the time the network is
fast, reliable and cheap enough. That's exactly why the assumptions stick:
the code works in testing and fails in the rare case, in production.

## What this means when you build

- For every remote call, ask: what if it's lost, slow, or duplicated? What
  if the reply is lost?
- Count round trips, not just calls, and batch where you can.
- Encrypt everything between machines, even inside your own network.
- Don't hard-code addresses or assume a fixed path; expect things to move.
- Test on a network that behaves badly on purpose, with
  [[fault-injection]].

## Further reading

- [The Eight Fallacies of Distributed Computing](http://nighthacks.com/jag/res/Fallacies.html), Peter Deutsch, hosted by James Gosling. The list itself, on one page.
- [21 years and counting of 'eight fallacies of distributed computing'](https://blog.apnic.net/2025/12/08/21-years-and-counting-of-eight-fallacies-of-distributed-computing/), George Michaelson, APNIC, 2025. Where the list came from, and each fallacy seen from the network operator's side.
