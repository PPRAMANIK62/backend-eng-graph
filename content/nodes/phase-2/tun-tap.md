---
id: tun-tap
title: TUN and TAP devices
depth: short
phase: 2
note: >-
  Virtual network devices that hand raw packets to a program instead
  of a wire.
needs: [ip-routing, ethernet-and-arp]
leads_to: []
compare_with: []
updated: 2026-09-29
---

# TUN and TAP devices

A TUN or TAP device is a network interface with no hardware behind it.
Where a real interface would put packets on a cable, a TUN device hands
them to a program through a [[file-descriptor]], and whatever that
program writes back arrives in the kernel as if it came off the wire.
VPNs are built on them, and this phase's lab uses one: a TCP stack
written in user space, talking to the real Linux stack over a TUN device.

## A network card that's really a program

Picture a machine with a device called `tun0` and a route that sends
`10.0.0.0/24` to it. You run `curl http://10.0.0.2/`.

1. curl opens a normal TCP socket. The kernel's own TCP/IP stack builds
   a SYN packet for `10.0.0.2`.
2. The routing table (see [[ip-routing]]) says `10.0.0.0/24` goes out
   through `tun0`, so the kernel "sends" the packet there.
3. There's no wire. The packet lands in a queue, and your program gets
   the whole IP packet, headers and all, when it calls `read()` on its
   TUN file descriptor.
4. Your program does whatever it likes: parses the SYN, and writes a
   SYN-ACK back with `write()`.
5. The kernel treats that written packet as received on `tun0`, runs it
   up its stack, and curl's connection moves forward.

To the kernel, your program is the other machine. That's what makes TUN
good for testing a network stack: the real one on the other side keeps
you honest.

![On the left, curl and the kernel's TCP/IP stack. The kernel routes packets for 10.0.0.0/24 to the tun0 device. Instead of a cable, tun0 connects to /dev/net/tun, where a user-space program reads whole IP packets with read() and sends its replies with write().](img/tun-tap-data-path.svg)

*The path of a packet through a TUN device. The "other end of the wire" is a file descriptor in your program.*

## TUN or TAP

The two differ in which layer of [[network-layers|the layer model]]
they hand you:

- **TUN** carries IP packets. You read and write IPv4 or IPv6 packets,
  no link-layer header. It's the right choice when you care about IP
  and above, like a TCP stack or a VPN.
- **TAP** carries Ethernet frames, MAC addresses and all. It behaves like
  a virtual Ethernet card, and is what you want
  when your program needs to see link-layer traffic like
  [[ethernet-and-arp|ARP]].

## Creating one

A program opens `/dev/net/tun` and makes an `ioctl` call, `TUNSETIFF`,
with a flag that says TUN (`IFF_TUN`) or TAP (`IFF_TAP`) and an optional
name like `tun%d`. The kernel creates the device and tells you its
real name, say `tun0`. From then on the file descriptor is the device:
`read` for outgoing packets, `write` for incoming ones.

A few details matter:

- **Add `IFF_NO_PI`.** Without it, each packet you read or write starts
  with 4 extra bytes: 2 of flags and 2 giving the protocol. Most
  programs don't want them.
- **The device lives as long as the descriptor.** Close it, or let the
  program exit, and the device and all its routes disappear. You can
  also make a persistent device and hand it to an ordinary user.
- **Creating one needs `CAP_NET_ADMIN`.** That's why `/dev/net/tun`
  itself can be open to everyone.
- **You still configure it like any interface.** The addresses and
  routes are ordinary kernel ones, set with the usual tools.
- **One descriptor can be a bottleneck.** Since Linux 3.8 a device can
  have several queues, one descriptor each, so several threads can read
  and write in parallel.

## Where it gets tricky

**A full queue drops packets.** By default, if your program reads too
slowly and the device's ring buffer fills, packets are dropped, and any
queueing discipline on the device is effectively bypassed. The kernel
docs (as of the Linux 7.3 release candidates) describe a newer
`IFF_BACKPRESSURE` flag that stops the queue instead so the qdisc can
hold packets. Check that your kernel has it before relying on it.

**TUN/TAP is not a packet filter.** Capture tools like tcpdump watch
traffic on an existing interface. A TUN/TAP device *is* an interface,
so you can run a capture on it too, which is the easiest way to see
what your program is really sending. See [[packet-capture]].

## What this means when you build

- For a user-space TCP stack, use TUN with `IFF_NO_PI`. You deal with IP
  packets and nothing below.
- Give the TUN side its own addresses and a route, and point real tools
  (`curl`, `ping`) at them. The kernel's stack is your test partner.
- Read the TUN descriptor promptly, or the kernel drops packets and
  your stack sees loss you didn't plan.
- Run `tcpdump -i tun0` while you work. It shows both directions.

## Further reading

- [Universal TUN/TAP device driver](https://docs.kernel.org/networking/tuntap.html), Maxim Krasnyansky et al., Linux kernel documentation. How to create a device, the frame format, multiqueue, backpressure, and TUN vs TAP.
