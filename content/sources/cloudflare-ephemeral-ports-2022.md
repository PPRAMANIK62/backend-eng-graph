---
id: cloudflare-ephemeral-ports-2022
title: How to stop running out of ephemeral ports and start to love long-lived connections
author: Marek Majkowski, Cloudflare
url: https://blog.cloudflare.com/how-to-stop-running-out-of-ephemeral-ports-and-start-to-love-long-lived-connections/
published: 2022-02-02
accessed: 2026-09-28
kind: blog
primary: true
---

## Summary

Cloudflare hit ephemeral port exhaustion in production. The post
explains how Linux picks a source address and port for an outgoing
connection, why a TCP connection is a 4-tuple so ports can be shared
across destinations, how bind-before-connect breaks that sharing, and
the socket options that fix it (easy for TCP, hard for UDP).

## Key claims

- Out of ephemeral ports, even ssh to localhost fails. "ssh: connect to host 127.0.0.1 port 22: Cannot assign requested address" (intro)
- Port exhaustion blocks all outgoing connections. "In both cases the problem was Linux running out of ephemeral ports. When this happens it's unable to establish any outgoing connections." (intro)
- The OS fills in the source address (from routing) and source port (from the ephemeral range) to complete the 4-tuple. "selecting an appropriate source address and source port to form the full 4-tuple for the connection" (Basics - how port allocation works)
- The range is the net.ipv4.ip_local_port_range sysctl, 32768 to 60999 on their machines. "net.ipv4.ip_local_port_range = 32768 60999" (Basics - how port allocation works, sysctl output)
- Their fix for UDP is complicated and leans on undocumented kernel behavior. "Our UDP code is more complex, based on little known low-level features, assumes cooperation between tenants and undocumented behaviour of the Linux operating system." (Summary)
- The default range is 28,232 ports. "The default ephemeral port range contains more than 28,000 ports (60999+1-32768=28232)." (Vanilla TCP is a happy case)
- A TCP connection is named by the full 4-tuple, so the same source port can go to different destinations. "In TCP the connection is identified by a full 4-tuple" (Vanilla TCP is a happy case)
- Plain connect() reuses source ports across destinations, and fails with EADDRNOTAVAIL only when one destination uses them all. "When the range is exhausted (against a single destination), we'll see EADDRNOTAVAIL error." (Vanilla TCP is a happy case)
- bind(src_ip, 0) before connect must pick a port no one else uses, because the kernel can't know you won't listen on it. "That's why the source two-tuple selected when calling bind() must be unique." (Manually selecting source IP address)
- So bind-before-connect caps you at the port range, whatever the destinations. "Each connection effectively \"locks\" a source port, so the number of connections is constrained by the size of the ephemeral port range." (Manually selecting source IP address)
- IP_BIND_ADDRESS_NO_PORT (Linux, 2015) delays picking the port until connect. "later in 2015 Linux introduced a proper fix: the IP_BIND_ADDRESS_NO_PORT socket option." (IP_BIND_ADDRESS_NO_PORT)
- Connected UDP sockets are limited by the range by default. "Usually, with Linux you can't have more than ~28,000 connected UDP sockets, even if they point to multiple destinations." (Vanilla UDP is limited)
- A TIME-WAIT socket blocks rebinding a fixed source port. "on the second cURL run it fails due to TIME-WAIT sockets" (footnote 1)
- Killing TIME-WAIT sockets is generally a bad idea. "Killing time-wait sockets is generally a bad idea, violating protocol, unneeded and sometimes doesn't work." (footnote 1)

## Visuals worth redrawing

- The 4-tuple table with two connections sharing one source port toward
  two destinations.

## My notes

- The post doesn't name the kernel version it tested on.
