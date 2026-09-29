---
id: langley-quic-sigcomm-2017
title: "The QUIC Transport Protocol: Design and Internet-Scale Deployment"
author: Adam Langley et al., Google
url: https://research.google/pubs/the-quic-transport-protocol-design-and-internet-scale-deployment/
kind: paper
primary: true
---

## Summary

Google's SIGCOMM 2017 paper on the QUIC it built and deployed before
the IETF version: why a new transport on UDP in user space, how it was
rolled out in Chrome and YouTube, what it gained and what it cost.
Opened the abstract page and the PDF linked from it. The numbers are
for Google QUIC with its own handshake, not RFC 9000 QUIC.

## Key claims

- QUIC runs in user space over UDP so it can ship with applications and get through middleboxes. "We developed QUIC as a user-space transport with UDP as a substrate." (1)
- Encryption stops middleboxes from depending on header details. "packets are authenticated and encrypted, preventing modification and limiting ossification of the protocol by middleboxes." (1)
- Changing TCP now takes a very long time. "simple protocol changes are now expected to take upwards of a decade to see significant deployment" (2)
- TCP lives in the OS kernel, so changes wait for OS upgrades. "pushing changes to TCP stacks typically requires OS upgrades." (2)
- Firewalls and NATs block or rewrite unfamiliar transports. "firewalls tend to block anything unfamiliar for security reasons and Network Address Translators (NATs) rewrite the transport header" (2)
- TCP plus TLS (of that time) cost several round trips before data. "TCP connections commonly incur at least one round-trip delay of connection setup time before any application data can be sent, and TLS adds two round trips to this delay" (2)
- Results: Search latency down 8.0% on desktop and 3.6% on mobile; YouTube rebuffers down 18.0% and 15.3%. "QUIC reduces latency of Google Search responses by 8.0% for desktop users and by 3.6% for mobile users, and reduces rebuffer rates of YouTube playbacks by 18.0% for desktop users and 15.3% for mobile users" (1)
- Scale then: over 30% of Google's egress, an estimated 7% of Internet traffic. "it currently accounts for over 30% of Google's total egress traffic in bytes and consequently an estimated 7% of global Internet traffic" (1)
- Discovery by Alt-Svc, then racing QUIC against TCP with a head start of up to 300 ms. "the client races a QUIC and a TLS/TCP connection, but prefers the QUIC connection by delaying connecting via TLS/TCP by up to 300 ms." (section "QUIC Discovery for HTTPS")
- Server CPU was 3.5 times TLS/TCP at first, about twice after optimisation. "QUIC's server CPU-utilization was about 3.5 times higher than TLS/TCP." and "we decreased the CPU cost of serving web traffic over QUIC to approximately twice that of TLS/TCP" (6.7 "Server CPU Utilization")
- 4.4% of video clients couldn't use QUIC, mostly behind enterprise firewalls. "4.4% of clients are unable to use QUIC, meaning that QUIC or UDP is blocked or the path's MTU is too small." (section on UDP blocking, 7.2)
- A one-bit change to an unencrypted header flag broke a firewall that classified QUIC, and clients hit a black hole. "The firewall used the QUIC flags field to identify QUIC packets, and the 1-bit change in the flags field confounded this detection logic" (7.5 "Experiences with Middleboxes")

- Google started QUIC as an experiment in 2013; the IETF working group came later. "We launched an early version of QUIC as an experiment in 2013." (1)
- Main CPU costs: crypto, UDP send and receive, and connection state. "The three major sources of QUIC's CPU cost were: cryptography, sending and receiving of UDP packets, and maintaining internal QUIC state." (6.7 "Server CPU Utilization")

- Many client devices run OS versions years old. "sizeable user populations often end up several years behind." (2)
- The TCP header isn't protected end to end, so middleboxes inspect and modify it. "has become fair game for middleboxes to inspect and modify." (2)
- UDP gets through middleboxes. "The use of UDP allows QUIC packets to traverse middleboxes." (1)
- User space lets QUIC ship inside applications. "Building QUIC in user-space facilitated its deployment as part of various applications and enabled iterative changes to occur at application update timescales." (1)
- Servers advertise QUIC with an Alt-Svc header first. "Our servers advertise QUIC support by including an "Alt-Svc" header in their HTTP responses" (section "QUIC Discovery for HTTPS")
- A few header fields stay unencrypted so receivers can find the connection. "However a few fields are left unencrypted, to allow a receiver to look up local connection state and decrypt incoming packets." (7.5 "Experiences with Middleboxes")
- The firewall let first packets through and blocked later ones, defeating TCP fallback. "causing the firewall to allow initial packets through but blocking subsequent packets." (7.5 "Experiences with Middleboxes")

- The 3.5x CPU figure was measured serving YouTube. "When we started measuring the cost of serving YouTube traffic over QUIC, we found that QUIC’s server CPU-utilization was about 3.5 times higher than TLS/TCP." (6.7 "Server CPU Utilization")
- Clients that couldn't use QUIC were commonly on corporate networks. "Manual inspection showed that these users are commonly found in corporate networks, and are likely behind enterprise firewalls." (7.2)

## Visuals worth redrawing

- Figure 1: QUIC's place in the HTTPS stack next to HTTP/2 + TLS + TCP.

## My notes

- 2017 numbers for pre-IETF QUIC. Useful for the "why" and for the CPU cost story, not as current performance claims.
