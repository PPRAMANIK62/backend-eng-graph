---
id: mccanne-jacobson-bpf-1993
title: "The BSD Packet Filter: A New Architecture for User-level Packet Capture"
author: Steven McCanne and Van Jacobson
url: https://www.tcpdump.org/papers/bpf-usenix93.pdf
published: 1993-01
accessed: 2026-09-28
kind: paper
primary: true
---

## Summary

The Winter USENIX 1993 paper (preprint dated 1992-12-19) that introduced
BPF, the in-kernel packet filter under tcpdump and libpcap. It splits
capture into a network tap, which gets a look at every packet from the
driver, and a filter, which decides in the kernel whether to copy a
packet (and how much of it) to the listening program.

## Key claims

- Capture programs run in user space, so packets must cross into it; filtering in the kernel cuts that copying. "This copying can be minimized by deploying a kernel agent called a packet filter, which discards unwanted packets as early as possible." (Abstract)
- Two parts: tap and filter. "The network tap collects copies of packets from the network device drivers and delivers them to listening applications. The filter decides if a packet should be accepted and, if so, how much of it to copy to the listening application." (2 The Network Tap)
- The driver calls BPF before the normal stack. "But when BPF is listening on this interface, the driver first calls BPF." (2 The Network Tap)
- Each listening program has its own filter and buffer; accepted packets are copied into the buffer, then normal protocol processing continues. (2 The Network Tap, Figure 1)
- tcpdump was BPF's main user, and its compiler is part of tcpdump. "The most widely used is tcpdump [4], a network monitoring and data acquisition tool." (4 Applications) and "Our BPF compiler (part of tcpdump[4])" (3.2 The BPF Model, footnote 7)
- Copying unwanted packets was what made the older capture system (Sun's NIT) expensive. "this gratuitous copy makes NIT almost two orders of magnitude more expensive" (2.2 Tap Performance Measurements)
- Speed: a register-based filter machine. "The BSD Packet Filter (BPF) uses a new, register-based filter evaluator that is up to 20 times faster than the original design." (Abstract)

## Visuals worth redrawing

- Figure 1 (BPF overview): driver, tap, per-listener filter and buffer,
  the protocol stack beside it. Redrawn for `packet-capture`.

## My notes

- Linux doesn't use the BSD tap code; it has its own packet sockets and
  runs BPF-style filters (classic BPF, later eBPF). No opened source here
  covers the Linux side; don't claim details of it.
- The paper's "register-based" quote has a line-break hyphen in the PDF
  text ("register-" / "based"); copied as one word.
