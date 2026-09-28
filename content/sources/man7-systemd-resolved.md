---
id: man7-systemd-resolved
title: systemd-resolved.service(8), Linux manual page
author: systemd project
url: https://man7.org/linux/man-pages/man8/systemd-resolved.service.8.html
kind: docs
primary: true
---

## Summary

The man page for systemd-resolved (systemd 262~devel, from the upstream
repo). A system service that gives local programs name
resolution through D-Bus, Varlink, glibc's getaddrinfo (via
nss-resolve) and a local DNS stub listener on 127.0.0.53. It caches
answers, and differs from the classic glibc stub in how it treats search
domains.

## Key claims

- It's a caching stub resolver. "It implements a caching and validating DNS/DNSSEC stub resolver, as well as an LLMNR and MulticastDNS resolver and responder." (DESCRIPTION)
- A local DNS stub listens on 127.0.0.53 and 127.0.0.54 for programs that speak DNS directly. "systemd-resolved provides a local DNS stub listener on the IP addresses 127.0.0.53 and 127.0.0.54 on the local loopback interface." (DESCRIPTION)
- getaddrinfo goes to resolved only through the nss-resolve module. "Usage of the glibc NSS module nss-resolve(8) is required in order to allow glibc's NSS resolver functions to resolve hostnames via systemd-resolved." (DESCRIPTION)
- In the compatibility mode, /etc/resolv.conf lists 127.0.0.53 as the only server. "lists the 127.0.0.53 DNS stub (see above) as only DNS server." (/ETC/RESOLV.CONF)
- It does not implement ndots: any name with a dot is a full name. "Any name with at least one dot is always interpreted as a FQDN." (COMPATIBILITY WITH THE TRADITIONAL GLIBC STUB RESOLVER)
- It reads and caches /etc/hosts, which wins over DNS. "Entries in /etc/hosts have highest priority." (COMPATIBILITY ...)
- It flushes its caches when the network configuration changes; `resolvectl flush-caches` flushes by hand. "systemd-resolved flushes the caches automatically anyway any time the host's network configuration changes." (SIGNALS, SIGUSR2)

## Visuals worth redrawing

None.

## My notes

- Good for dns-caching: there can be a cache on your own machine before
  the recursive resolver.
