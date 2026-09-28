---
id: packet-capture
title: Packet capture
depth: short
phase: 2
note: >-
  tcpdump and Wireshark: seeing what is really on the wire.
needs: [network-layers]
leads_to: []
compare_with: []
updated: 2026-09-29
---

# Packet capture

Packet capture means recording copies of the packets going through a
network interface so you can read them. `tcpdump` does it from the
command line, and Wireshark shows the result with every field decoded.
When logs and metrics disagree about what happened between two
machines, a capture settles it: you see the handshake, the
retransmissions, the reset, with timestamps.

## How a capture sees packets

Capture programs run in user space, but packets live in the kernel. The
design tcpdump grew up with is BPF, the BSD Packet Filter, published
by Steven McCanne and Van Jacobson in 1993. It has two parts:

- A **tap** in the network driver. When a capture is running, the
  driver hands each packet to the tap before passing it up the normal
  stack.
- A **filter**, supplied by the capture program and run inside the
  kernel. It decides whether this packet is wanted, and how many bytes
  of it to keep.

Only packets that pass the filter get copied into a buffer for the
program. Copying every packet across into user space was the expensive
part of earlier systems. Throwing away unwanted packets in the kernel,
as early as possible, is what made capturing on a busy machine
practical.

![A packet arrives at the network driver. The driver passes it to the BPF tap, which runs each listening program's filter. Packets that match are copied into that program's buffer, and tcpdump reads from the buffer in user space. Separately, the driver passes the packet up the normal protocol stack as usual.](img/packet-capture-bpf-tap.svg)

*The tap sits beside the normal path. Adapted from Figure 1 of McCanne and Jacobson, "The BSD Packet Filter" (Winter USENIX, 1993).*

## Reading a tcpdump line

The filter is the expression you give tcpdump. A few that cover most
days:

```
tcpdump -n 'port 8080'                       # traffic to or from port 8080
tcpdump -n 'host 192.0.2.1'                  # one machine
tcpdump -n icmp                              # ping, unreachables, time exceeded
tcpdump -n 'tcp[tcpflags] & (tcp-syn|tcp-fin) != 0'   # connection opens and closes
```

`-n` prints addresses as numbers instead of looking up host names. A TCP line looks like this:

```
IP rtsg.1023 > csam.login: Flags [S], seq 768512:768512, win 4096, opts [mss 1024]
```

Source and destination (address and port), then the TCP flags: `S` is
SYN, `F` FIN, `P` push, `R` reset, and `.` is ACK. So `[S]`, `[S.]`,
`[.]` is a three-way handshake (see [[tcp-handshake]]). Then sequence
and acknowledgement numbers, the receive window, options, and payload
length. Each layer's header from [[network-layers]] shows up as a part
of the line.

For anything longer than a glance, save the raw packets with `-w
file.pcap` and read them later with `-r`, or open the file in
Wireshark, which decodes each protocol field by field and adds filters
and statistics on top. Capturing live usually needs privileges; reading
a saved file doesn't. That makes a common split: capture on the server
with tcpdump, analyse on your laptop in Wireshark.

## Where it gets tricky

**Outgoing packets are captured before the card finishes them.** Network
cards can compute checksums and cut large sends into packets
themselves (TCP segmentation offload, TSO). The capture sees the packet
before that happens. So on the sending machine every outgoing TCP
checksum can look bad (tcpdump's `-K` skips checking them), and large
sends show up marked "presumed TSO". Neither is a bug.

**Timestamps are when the kernel saw the packet**, not when it hit the
wire. The delay between the card receiving a packet and the kernel
stamping it isn't accounted for.

**A capture can drop packets.** If the program can't keep up, the
kernel buffer fills and packets are lost from the capture, not from the
network. tcpdump reports a "dropped by kernel" count when it exits;
check it before concluding a packet was never sent. Keeping less of
each packet (`-s`) or filtering tighter helps.

## What this means when you build

- Reach for a capture when two sides disagree about what was sent. It's
  the ground truth for anything below your application.
- Filter tight and write to a file on busy servers: `tcpdump -n -w
  out.pcap 'host X and port Y'`.
- Check the drop count, and remember offload artifacts on the sending
  side.
- Capture on the interface you care about: a TUN device like the one in
  this phase's lab ([[tun-tap]]) works the same as a physical card.

## Further reading

- [tcpdump(1)](https://www.tcpdump.org/manpages/tcpdump.1.html), The Tcpdump Group, 2026. Options, filter examples, and how to read the output, including the offload and timestamp caveats.
- [The BSD Packet Filter](https://www.tcpdump.org/papers/bpf-usenix93.pdf), Steven McCanne and Van Jacobson, 1993. Why filtering happens in the kernel and how the tap works.
- [Wireshark User's Guide, Chapter 1](https://www.wireshark.org/docs/wsug_html_chunked/ChapterIntroduction.html), the Wireshark project. What Wireshark does with a capture file.
