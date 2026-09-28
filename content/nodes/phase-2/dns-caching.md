---
id: dns-caching
title: DNS caching
depth: short
phase: 2
note: >-
  Every DNS answer carries a TTL that says how long it may be cached,
  including "this name doesn't exist". Why a DNS change takes a while
  to reach everyone.
needs: [dns]
leads_to: []
compare_with: []
---

# DNS caching

Every DNS answer comes with a time to live (TTL), a number of seconds
that says how long anyone may keep it before asking again. Caching is
what makes [[dns]] cheap enough to sit in front of every connection.
It's also why, after you change a record, some clients keep going to
the old address for minutes, hours or longer.

## Every answer comes with a countdown

The zone's owner sets the TTL, and it travels with each record. A
recursive resolver that fetches a record stores it and counts the TTL
down. When another client asks, it answers from the cache and hands out
the time that's left, not the original number. A TTL of 0 means "use
this for this one lookup, don't cache it".

Julia Evans watched this in 2020 through Google's public resolver,
8.8.8.8. Her new record showed 299 seconds left on the first query.
After she changed it, a query still returned the old address with 144
seconds left. After 5 minutes, every answer was the new one.

## Caches at every layer

There's rarely just one cache between your program and the
authoritative server:

- **Your program.** Some runtimes cache answers in memory, and some,
  the JVM among them, can be set to keep them until the process
  restarts.
- **Your machine.** On Linux, systemd-resolved is a caching stub. It
  also caches `/etc/hosts`, which wins over DNS, and flushes its cache
  when the network configuration changes. `resolvectl flush-caches`
  empties it by hand.
- **The recursive resolver.** The big one, shared by every client that
  uses it. Sharing one cache among many clients was one of the original
  reasons for recursive servers.

A big public resolver isn't one cache either. During her test, 8.8.8.8
sometimes gave Julia Evans the new address and sometimes the old one,
most likely because her queries landed on backends with separate caches.

## Why a change takes a while

Nothing gets pushed when you change a record. The authoritative server
has the new data at once, and every cache holding the old answer keeps
serving it until its TTL runs out. People call this "propagation", but
it's caches expiring one by one.

![Timeline with two rows. The authoritative server holds the old A record, then the new one from the moment the record is changed. The resolver's cache is empty until the first lookup, then holds the old answer with a TTL of 300 seconds. Between the change and the moment that TTL runs out, marked as the stale window, clients still get the old address. After it runs out, the next lookup caches the new answer.](img/dns-caching-ttl-change.svg)

*A change reaches a cache only when that cache's copy expires.*

So a brand-new name shows up right away, because nothing could have
cached it. Changing name servers is slow: the NS records for your domain
are served by the TLD's servers with the TLD's TTL. In Julia Evans's
2020 example, `.com` handed out NS records for `github.com` with a TTL
of 172,800 seconds, 48 hours, which is where a registrar's "this will
take 48 hours" comes from.

The old advice still works: before a planned change, lower the TTL,
make the change, then raise it again. The lower TTL only counts once
caches have dropped the copies they got under the old one, so lower it
at least one old TTL ahead.

## Caching "no"

Resolvers also cache the fact that something isn't there:

- **NXDOMAIN**: the name doesn't exist. Cached for that name.
- **NODATA**: the name exists but has no records of the type you asked
  for. It comes back as success with an empty answer, and is cached for
  that name and type.

A "no" has no record to carry a TTL, so the authoritative server
attaches the zone's SOA record. The negative TTL is the smaller of the
SOA's own TTL and its MINIMUM field. Since RFC 2308 (1998), negative
caching is a required part of a resolver.

This catches people out. If anything looks up `new-service.example.com`
before you create it (a health check, a deploy script, you testing),
the NXDOMAIN gets cached, and that resolver keeps saying "no such name"
until the negative TTL runs out. Resolvers may also cache a server
failure, for at most five minutes.

## Where it gets tricky

**Not everyone follows the TTL.** Some resolvers, ISP ones among them,
keep answers longer than the TTL says, and people hardcode addresses in
`/etc/hosts`. Julia Evans's estimate (not a measurement) for a 5-minute
TTL: most clients switch within about 15 minutes, and stragglers take
days.

**Since 2020, expired doesn't mean gone.** RFC 8767 (serve-stale)
redefined the TTL as how long a record may be cached before the resolver
must try to refresh it. If the authoritative servers can't be reached
then, the resolver may keep serving the old record, with a TTL of 30
seconds (the recommended value). The RFC also suggests capping TTLs at
7 days. BIND, Knot Resolver, OpenDNS and Unbound already had options
for this. It keeps names working when your DNS provider is down, and it
means an old answer can outlive its TTL.

## What this means when you build

- Before a planned move, lower the TTL at least one old TTL ahead, and
  raise it again afterwards.
- Keep the old address serving for days after a change.
- Don't look up a name before you create it, or wait out the negative
  TTL if you did.
- Find out whether your runtime caches DNS answers in the process, and
  for how long. A service that caches forever never sees a failover.
- Plan name server changes in days, not minutes.

## Further reading

- [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034), P. Mockapetris, 1987. The original meaning of the TTL, and the advice to lower it before a planned change.
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308), M. Andrews, 1998. NXDOMAIN and NODATA, where the negative TTL comes from, and caching server failures.
- [RFC 8767: Serving Stale Data to Improve DNS Resiliency](https://www.rfc-editor.org/rfc/rfc8767), D. Lawrence, W. Kumari and P. Sood, 2020. The current TTL definition, serve-stale, and the 7-day cap.
- [What happens when you update your DNS?](https://jvns.ca/blog/how-updating-dns-works/), Julia Evans, 2020. A real record change watched through 8.8.8.8, and why name server changes are slow.
- [systemd-resolved.service(8)](https://man7.org/linux/man-pages/man8/systemd-resolved.service.8.html), systemd project, 2026. The caching stub on many Linux machines, and how to flush it.
