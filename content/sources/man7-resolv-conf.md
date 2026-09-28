---
id: man7-resolv-conf
title: resolv.conf(5), Linux manual page
author: Linux man-pages project
url: https://man7.org/linux/man-pages/man5/resolv.conf.5.html
published: 2026-08-22
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The man page for /etc/resolv.conf, the config file of the stub resolver
built into glibc (man-pages 6.19). It lists which recursive servers to
ask, the search list for short names, and options like timeout,
attempts, ndots, rotate, edns0 and use-vc.

## Key claims

- The resolver is a set of C library routines; the file is read the first time a process uses them. "The resolver is a set of routines in the C library that provide access to the Internet Domain Name System (DNS)." (DESCRIPTION)
- Up to 3 nameserver lines, tried in order; on timeout, move to the next. "Up to MAXNS (currently 3, see <res_state.h>) name servers may be listed, one per keyword." (nameserver)
- The retry loop. "try a name server, and if the query times out, try the next, until out of name servers, then repeat trying all the name servers until a maximum number of retries are made." (nameserver)
- With no nameserver lines, the local machine is used. "If no nameserver entries are present, the default is to use the name server on the local machine." (nameserver)
- Search list: names with fewer than ndots dots are tried with each search domain appended. "Resolver queries having fewer than ndots dots (default is 1) in them will be attempted using each component of the search path in turn until a match is found." (search)
- Search lists can be slow and noisy. "Note that this process may be slow and will generate a lot of network traffic if the servers for the listed domains are not local" (search)
- Default timeout per try is 5 seconds, capped at 30. "Measured in seconds, the default is RES_TIMEOUT (currently 5, see <resolv.h>)." (options, timeout:n)
- The timeout isn't the total time of a lookup. "This may not be the total time taken by any resolver API call and there is no guarantee that a single resolver API call maps to a single timeout." (options, timeout:n)
- Default attempts is 2, capped at 5. "The default is RES_DFLRETRY (currently 2, see <resolv.h>)." (options, attempts:n)
- glibc sends IPv4 and IPv6 (A and AAAA) lookups in parallel since glibc 2.9. "By default, glibc performs IPv4 and IPv6 lookups in parallel since glibc 2.9." (options, single-request)
- use-vc forces TCP (since glibc 2.14). "This option forces the use of TCP for DNS resolutions." (options, use-vc)
- edns0 turns on EDNS (since glibc 2.6). (options, edns0)

## Visuals worth redrawing

None.

## My notes

- The page says nothing about caching; don't claim glibc caches or
  doesn't from this page.
