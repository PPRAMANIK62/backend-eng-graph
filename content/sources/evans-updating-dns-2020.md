---
id: evans-updating-dns-2020
title: What happens when you update your DNS?
author: Julia Evans
url: https://jvns.ca/blog/how-updating-dns-works/
kind: blog
primary: false
---

## Summary

A walk through one resolution by hand with dig (root, then .com, then
github.com's name servers), followed by a real test of changing an A
record on Cloudflare and watching 8.8.8.8 pick it up. Explains why
changes seem slow: caches keyed by TTL, much longer TTLs on NS records,
and resolvers and programs that ignore TTLs.

## Key claims

- Two kinds of servers: authoritative ones hold the records; recursive ones find and cache them. (how DNS works: recursive vs authoritative)
- A recursive resolver starts from root server addresses built into it (a root hints file). "step 1: it has IP addresses for the root DNS servers hardcoded in its source code." (how does a recursive DNS server query for github.com?)
- The root refers to .com's servers, .com refers to github.com's servers, which give the A record. Shown with `dig @198.41.0.4 github.com`, then `dig @192.5.6.30 github.com`, then `dig @205.251.193.165 github.com`. (same section)
- Referrals carry NS records in the authority section and their addresses in the additional section. "there's an authority section with some NS records and an additional section with A records so you don't need to do an extra lookup" (same section)
- `dig +trace` shows every step a recursive resolver would take. "how to see all of a recursive DNS server's steps: dig +trace" (section heading)
- In practice a resolver almost always has .com's servers cached already. "in practice, 99.99% of the time it'll already have the address of the .com nameservers cached" (same section; her estimate, not a measurement)
- github.com's A record had a 60-second TTL in her 2020 example. "the TTL for the A record github's nameserver returns for its DNS record is 60, which means 60 seconds" (TTLs)
- A brand-new record showed up at 8.8.8.8 at once, because nothing was cached. "There was no need to wait at all, because there was no test.jvns.ca DNS record before that could have been cached." (option 1)
- The new record was cached for about 5 minutes (299 s left on first query); after the change a query still showed the old address with 144 s left; after 5 minutes all answers were new. "After I waited 5 minutes, all of the 8.8.8.8 caches had updated and were always returning the new 5.6.7.8 record." (option 1)
- Her registrar warned that changing name servers would take 48 hours, because NS TTLs are long; the registrar updates the .com servers. "my domain registrar tells the .com nameservers to make the update." (nameserver TTLs are much longer; how do your nameservers get updated?)
- Changing it, 8.8.8.8 kept the old answer until the TTL ran out, and answers were inconsistent because 8.8.8.8 is many backends with their own caches. "sometimes it'll give me the new IP and sometimes the old IP, I guess because 8.8.8.8 actually load balances to a bunch of different backends which each have their own cache." (option 1)
- Some resolvers ignore TTLs. "Some ISP DNS servers will cache records for longer than the TTL specifies, like maybe for 2 days instead of 5 minutes." (you can't always rely on the TTL)
- Her expectation (not measured): most clients move fast, stragglers take days. "a large percentage of clients will move over to the new IPs quickly (like within 15 minutes), and then there will be a bunch of stragglers that slowly update over the next few days." (you can't always rely on the TTL)
- NS records from .com had a TTL of 172800 seconds, 48 hours, which is why changing name servers is slow. "172800 seconds is 48 hours!" (nameserver TTLs are much longer)
- Programs may cache DNS answers in memory forever; the JVM can be configured to. "some programs will also cache DNS records indefinitely in memory (until the program is restarted)." (your program's DNS resolver library might also cache DNS records)

Added for `dns-caching` audit:

- People may pin the old address by hand. "And people can always hardcode the old IP address in their /etc/hosts." (you can't always rely on the TTL)
- The JVM example is an AWS article on setting the JVM's DNS TTL. "For example, AWS has an article on Setting the JVM TTL for DNS Name Lookups ." (your program's DNS resolver library might also cache DNS records)

## Visuals worth redrawing

None; it's dig output.

## My notes

- Secondary source, but she ran the commands; the 60 s and 172800 s TTLs
  are from her 2020 output, so date them.
