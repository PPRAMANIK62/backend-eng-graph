---
id: cloudflare-syn-packet-handling-2018
title: SYN packet handling in the wild
author: Marek Majkowski, Cloudflare
url: https://blog.cloudflare.com/syn-packet-handling-in-the-wild/
kind: blog
primary: true
---

## Summary

How Linux (4.x era) handles incoming SYNs on a listening socket: the
SYN queue for half-open connections and the accept queue for finished
ones, what the listen() backlog controls, what happens when the
application is slow to accept, and how SYN cookies defend against SYN
floods and what they cost.

## Key claims

- Every listening socket has two queues. "each bound socket, in the \"LISTENING\" TCP state has two separate queues" (The tale of two queues)
- The SYN queue holds half-open connections and resends SYN+ACKs. "It's responsible for sending out SYN+ACK packets and retrying them on timeout." (SYN Queue)
- By default the SYN+ACK is retried 5 times and the half-open connection times out after 63 s (quoting the kernel doc). "With this the final timeout for a passive TCP connection will happen after 63 seconds." (SYN Queue)
- Before kernel 4.3 the SYN queue length was counted differently, and tcp_max_syn_backlog no longer caps it. "This SYN Queue cap used to be configured by the net.ipv4.tcp_max_syn_backlog toggle, but this isn't the case anymore." (Queue size limits)
- The SYN-ACK retry count is 5 by default. "net.ipv4.tcp_synack_retries = 5" (SYN Queue, sysctl output)
- A full accept queue drops SYNs and ACKs and bumps two counters, readable with nstat. "The TcpExtListenOverflows / LINUX_MIB_LISTENOVERFLOWS counter is incremented." and "You can trace the Accept Queue overflow stats by looking at nstat counters" (Accept Queue)
- Big floods are dropped at the firewall rather than answered with cookies. "Instead, we attempt to drop the malicious SYN packets on the firewall layer." (SYN Floods at Cloudflare scale)
- A brief application stall can overflow the accept queue and bump ListenDrops with nothing else wrong. "It turns out our application was stuck for fraction of a second." (Slow application)
- The default SYN cookie setting is fine. "Default is good, don't change it." (SYN Flood)
- When the final ACK arrives, the kernel builds a full socket and moves it to the accept queue. "On SYN Queue match, the kernel removes the item from the SYN Queue, happily creates a fully fledged connection (specifically: struct inet_sock), and adds it to the Accept Queue." (SYN Queue)
- accept() takes connections off the accept queue. "When a process calls accept(), the sockets are de-queued and passed to the application." (Accept Queue)
- Both queue limits come from listen()'s backlog, capped by somaxconn (as of kernel 4.x). "Nowadays net.core.somaxconn caps both queue sizes." (Queue size limits)
- Far-away clients hold SYN queue slots longer. "The larger the average round trip time to the client, the more slots are going to be used." (Perfect backlog value)
- Each SYN queue entry used 256 bytes on kernel 4.14. "Each struct inet_request_sock entry in SYN Queue takes 256 bytes of memory on kernel 4.14." (Perfect backlog value)
- When the accept queue is full, Linux drops incoming SYNs and ACKs as push-back. "There is a strong rationale for dropping inbound packets: it's a push-back mechanism." (Slow application)
- A SYN flood fills the SYN queue; before 1996 this could take down almost any TCP server. "Before 1996 it was possible to successfully deny the service of almost any TCP server with very little bandwidth, just by filling the SYN Queues." (SYN Flood)
- SYN cookies let the server answer without storing anything. "SYN Cookies are a construct that allows the SYN+ACK to be generated statelessly, without actually saving the inbound SYN and wasting system memory." (SYN Flood)
- A real client's ACK carries the cookie back and is verified. "When the other party is real, it will respond with a valid ACK packet including the reflected sequence number, which can be cryptographically verified." (SYN Flood)
- Linux turns SYN cookies on only when a SYN queue fills. "By default SYN Cookies are enabled when needed - for sockets with a filled up SYN Queue." (SYN Flood)
- The cookie is the 32-bit sequence number: 6 bits of time, 2 bits of MSS, 24 bits of hash. (SYN Cookies and TCP Timestamps, diagram)
- So options like SACK and window scaling are lost unless timestamps carry them. "Information about Timestamps, ECN, Selective ACK, or Window Scaling is lost, and can lead to degraded TCP session performance." (SYN Cookies and TCP Timestamps)
- Since Linux 4.4 the kernel can send millions of SYN cookies per second. "This was fixed in 4.4 and now you can rely on the kernel to be able to send millions of SYN Cookies per second" (Evolving landscape)
- At Cloudflare's scale, floods over 200 million packets per second are dropped by firewall rules instead. "we see attacks of more than 200 Million packets per second." (SYN Floods at Cloudflare scale)

## Visuals worth redrawing

- The two queues on a listening socket: SYN queue then accept queue,
  with accept() taking from the end.
- The SYN cookie bit layout (6 / 2 / 24 bits).

## My notes

- Written against Linux 4.x. The kernel's ip-sysctl doc today still
  calls tcp_max_syn_backlog a per-listener limit, so the queue sizing
  rule may have changed again. Don't quote exact sizing rules.
