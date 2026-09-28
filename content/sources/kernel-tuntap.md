---
id: kernel-tuntap
title: Universal TUN/TAP device driver
author: Maxim Krasnyansky, Maksim Yevmenkin, Florian Thiel and kernel developers
url: https://docs.kernel.org/networking/tuntap.html
published: 2002 (document revision), served as part of the 7.3.0-rc5 docs
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The kernel's own documentation for TUN and TAP: virtual network devices
whose "wire" is a file descriptor in a user-space program. A program
opens /dev/net/tun, asks for a tun or tap device with an ioctl, then
reads the packets the kernel sends to that device and writes packets the
kernel should treat as received.

## Key claims

- What it is. "TUN/TAP provides packet reception and transmission for user space programs." (1. Description)
- Instead of a cable, a program. "instead of receiving packets from physical media, receives them from user space program and instead of sending packets via physical media writes them to the user space program." (1. Description)
- Open /dev/net/tun, then ioctl; the device appears as tunXX or tapXX. "In order to use the driver a program has to open /dev/net/tun and issue a corresponding ioctl() to register a network device with the kernel." (1. Description)
- The device lives as long as the fd. "When the program closes the file descriptor, the network device and all corresponding routes will disappear." (1. Description)
- The device is configured like any other interface, and its routes are ordinary kernel routes. "Let's say that you configured IPv6 on the tap0, then whenever the kernel sends an IPv6 packet to tap0, it is passed to the application" (FAQ, "How does Virtual network device actually work?")
- TAP looks like an Ethernet card to the kernel. "It can be seen as a simple Point-to-Point or Ethernet device" (1. Description)
- TUN is IP packets, TAP is Ethernet frames. "TUN works with IP frames. TAP works with Ethernet frames." (FAQ)
- The ioctl is TUNSETIFF with IFF_TUN or IFF_TAP; the kernel fills in the real name (e.g. "tun0"). (3.1 Network device allocation)
- Without IFF_NO_PI, each packet read or written starts with 2 bytes of flags and 2 bytes of protocol. (3.2 Frame format)
- CAP_NET_ADMIN is needed to create devices, so /dev/net/tun can be world-accessible. "CAP_NET_ADMIN is required for creating network devices or for connecting to network devices which aren’t owned by the user in question." (2. Configuration)
- Persistent devices can be handed to unprivileged users. (2. Configuration)
- Multiqueue since Linux 3.8: open several fds with IFF_MULTI_QUEUE to spread packets across queues. "From version 3.8, Linux supports multiqueue tuntap which can uses multiple file descriptors (queues) to parallelize packets sending or receiving." (3.3)
- IFF_BACKPRESSURE (documented in the 7.3.0-rc5 docs): without it, TX drops happen when the ring buffer is full and any qdisc is bypassed; with it the kernel stops the queue and lets the qdisc hold packets. "Without it, TX drops occur when the internal ring buffer is full, so any attached qdisc is effectively bypassed and applications only learn about congestion through those drops." (3.4 qdisc backpressure)
- The main use is tunnelling (VPNs like VTun): read a packet, encrypt it, send it over TCP or UDP, and the other side writes it into its own TAP. (FAQ, "How does Virtual network device actually work?")
- TUN/TAP vs BPF: BPF is a filter on an existing interface; TUN/TAP is an interface, and BPF can be attached to it. (FAQ)

## Visuals worth redrawing

None; the data path (app socket -> kernel stack -> tun0 -> your fd)
is easy to draw.

## My notes

- The docs build showed 7.3.0-rc5 on 2026-09-28. The lab machine runs
  Linux 7.1.9; IFF_BACKPRESSURE may not be there. Check
  include/uapi/linux/if_tun.h on the machine before using it.
- The quoted apostrophe in "aren't" is a curly one on the page.
