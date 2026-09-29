---
id: man7-tc-netem
title: tc-netem(8), Linux manual page
author: iproute2 project (netem by Stephen Hemminger)
url: https://man7.org/linux/man-pages/man8/tc-netem.8.html
kind: docs
primary: true
---

## Summary

The man page for netem, the Linux queueing discipline that emulates a bad
network on an interface: delay with jitter and distributions, loss (random,
Markov or Gilbert-Elliot bursts), corruption, duplication, reordering, rate
limits and slotting. Read from man7.org, built from the iproute2 git
repository when this was written.

## Key claims

- What it is. "The netem queue discipline provides Network Emulation functionality for testing protocols by emulating the properties of real-world networks." (DESCRIPTION)
- Impairments offered. "The queue discipline provides one or more network impairments to packets such as: delay, loss, duplication, and packet corruption." (DESCRIPTION)
- Delay takes jitter and correlation; distributions include uniform, normal, pareto and paretonormal (for long tails). "This is useful to emulate long-tail distributions." (OPTIONS, distribution pareto)
- Loss can be independent per packet, or bursty via a 4-state Markov chain or the Gilbert-Elliot model. "Each packet loss is independent." (OPTIONS, loss random)
- A seed makes random loss and corruption reproducible. "Specifies a seed to guide and reproduce the randomly generated loss or corruption events." (OPTIONS, seed)
- Reordering needs some delay to work. "For any method of reordering to work, some delay is necessary." (LIMITATIONS)
- Limited by kernel timer granularity. "Netem is limited by the timer granularity in the kernel." (LIMITATIONS)
- For realistic TCP tests, put it on the receiver's ingress because of TCP Small Queues. "Due to mechanisms like TSQ (TCP Small Queues), for TCP performance test results to be realistic netem must be placed on the ingress of the receiver host." (LIMITATIONS)
- It acts on outgoing packets of a device; example adds 100 ms to everything leaving eth0. "Add fixed amount of delay to all packets going out on device eth0." (EXAMPLES)
- Example of random loss. "This causes 1/10th of a percent (i.e 1 out of 1000) packets to be randomly dropped." (EXAMPLES)
- Can be applied to only some traffic with a prio qdisc and a filter. "It is possible to selectively apply impairment using traffic classification." (EXAMPLES)

## Visuals worth redrawing

None.

## My notes

- The page's example text says "100ms ± 10ms" for a command that sets only
  100ms; the jitter belongs to the next example. A small doc bug.
