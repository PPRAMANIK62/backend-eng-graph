---
id: dnsflagday-2020
title: DNS Flag Day 2020
author: DNS Flag Day organizers (DNS software vendors and operators)
url: https://www.dnsflagday.net/2020/
published: 2020
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

A coordinated change by DNS software vendors and operators, set for
2020-10-01, about IP fragmentation of large DNS answers over UDP. The
fix: default the EDNS buffer size to 1232 bytes so answers fit in one
packet, and make sure servers fall back to TCP when an answer doesn't
fit. The page now redirects to dns-violations.github.io.

## Key claims

- The date and the topic. "The next DNS Flag Day is scheduled for 2020-10-01. It focuses on the operational and security problems in DNS caused by Internet Protocol packet fragmentation." (What's next?)
- Fragmented UDP answers are unreliable and can be spoofed. "IP fragmentation is unreliable on the Internet today, and can cause transmission failures when large DNS messages are sent via UDP." (DNS Flag Day 2020)
- The two-part fix: small UDP answers, TCP fallback. "ensuring that DNS servers can switch from UDP to TCP when a DNS response is too big to fit in this limited buffer size." (DNS Flag Day 2020)
- The number: 1232 bytes, from the IPv6 minimum MTU of 1280 minus 48 bytes of IPv6 and UDP headers. "An EDNS buffer size of 1232 bytes will avoid fragmentation on nearly all current networks." (Message Size Considerations)
- It's a default, not a hard cap. "Operators may still configure larger values if their networks support larger data frames and they are certain there is no risk of IP fragmentation." (Message Size Considerations)
- The querier asks for an EDNS buffer size, and the server must stay within it. "Authoritative DNS servers MUST NOT send answers larger than the requested EDNS buffer size!" (Action: Authoritative DNS Operators)
- Some networks block TCP port 53, which breaks the fallback; operators must make sure TCP/53 works. "as some of them block TCP/53." (Action: Authoritative DNS Operators)

Added 2026-09-28 for `dns` audit:

- Fragmented answers can be spoofed. "Even when fragmentation does work, it may not be secure; it is theoretically possible to spoof parts of a fragmented DNS message, without easy detection at the receiving end." (DNS Flag Day 2020)
- Who ran it. "The DNS Flag Day effort is community driven by DNS software and service providers, and supported by The DNS Operations, Analysis, and Research Center (DNS-OARC)" (Who’s behind DNS Flag Day?)

## Visuals worth redrawing

None.

## My notes

- RFC 6891 (EDNS, 2013) had suggested 4096 as a starting point with
  fallback to 1280-1410. Flag Day 2020 lowered the default. A real
  change over time worth noting.
