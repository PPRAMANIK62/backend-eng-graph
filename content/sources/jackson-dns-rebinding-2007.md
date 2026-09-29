---
id: jackson-dns-rebinding-2007
title: Protecting Browsers from DNS Rebinding Attacks
author: Collin Jackson, Adam Barth, Andrew Bortz, Weidong Shao, Dan Boneh (Stanford University)
url: https://crypto.stanford.edu/dns/dns-rebinding.pdf
kind: paper
primary: true
---

## Summary

The ACM CCS 2007 paper that laid out DNS rebinding in full: an attacker
who owns a domain answers the first lookup with their own server and a
later one with an address inside the victim's network, so the browser
treats both as one origin and lets the attacker's script read internal
pages. Shows that the old browser defense, DNS pinning, was broken by
plug-ins of the time, and proposes defenses at the resolver (dnswall),
the server (Host header checks) and the browser.

## Key claims

- What the attack does. "DNS rebinding attacks subvert the same-origin policy of browsers and convert them into open network proxies." (Abstract)
- The basic attack: short TTL first, then a second lookup to an internal address. "the attacker answers DNS queries for attacker.com with the IP address of his or her own server with a short time-to-live (TTL) and serves visiting clients malicious JavaScript." (1)
- Why the browser lets the script read the answer. "The browser believes the two servers belong to the same origin because they share a host name, and it allows the script to read back the response." (1)
- No DNS server is compromised; the attacker answers for their own domain. "The attacker simply provided valid, authoritative responses for attacker.com, a domain owned by the attacker." (1)
- So DNSSEC doesn't help. "Consequently, DNSSEC provides no protection against DNS rebinding attacks" (1)
- The attacker signs their own records. "the attacker can legitimately sign all DNS records provided by his or her DNS server in the attack." (1)
- All the attacker needs is a domain and some traffic, for example from an ad. "attract web traffic, for example by running an advertisement." (1)
- What an attacker can do with it. "Using DNS rebinding, an attacker can circumvent firewalls to spider corporate intranets, exfiltrate sensitive documents, and compromise unpatched internal machines." (1)
- The attack is old news even in 2007. "DNS rebinding attacks have been known for a decade" (1)
- DNS pinning, the classic defense. "once the browser resolves a host name to an IP address, the browser caches the result for a fixed duration, regardless of TTL." (1)
- Pinning didn't hold in the browsers of 2007. "We show that the classic defense against these attacks, called “DNS pinning,” is ineffective in modern browsers." (Abstract)
- Example: IE7 pinned for 30 minutes but switched to another A record within a second if the current server failed. "Internet Explorer 7 pins DNS bindings for 30 minutes." (3.1)
- The switch. "Unfortunately, if the attacker’s domain has multiple A records and the current server becomes unavailable, the browser will try a different IP address within one second." (3.1)
- Pins only work if everything that touches the network shares them; plug-ins with their own resolvers allowed "multi-pin" attacks. "To eliminate multi-pin attacks, pinning-based defense require that all browser technologies that access the network share a common pin database." (5.3, Pinning Pitfalls)
- Pinning also breaks legitimate cases, such as a name that is private on the VPN and public outside. "Pinning prevents employees from properly connecting to these severs after joining the organization’s Virtual Private Network (VPN)" (5.3, Smarter Pinning)
- Resolver defense: refuse to resolve outside names to inside addresses (their tool, dnswall). "block DNS responses that contain private IP addresses" (5.1)
- That stops firewall circumvention but not the other abuse. "Blocking external names from resolving to internal addresses prevents firewall circumvention but does not defend against IP hijacking." (5.1)
- Server defense: check the Host header, which scripts can't forge. "One server-side defense for these attacks is therefore to reject incoming HTTP requests with unexpected Host headers" (5.3)
- Another defense: put more into the origin (the IP address or public key), so the rebound name is a new origin. "Another defense against DNS rebinding attacks is to refine origins to include additional information, such as the server’s IP address [28] or public key [27, 23]" (5.3)

## Visuals worth redrawing

- Figure 1: browser client, attacker.com at time t0 pointing to the
  attacker's web server, attacker.com at time t1 pointing to a target
  server behind the firewall.

## My notes

- The per-browser pin times (Table 1, section 3) are from 2007 browsers
  and plug-ins (Flash, Java) that no longer exist. Don't reuse them as
  current numbers.
- The Host header argument assumes scripts can't set Host; the paper
  says that for XMLHttpRequest.
