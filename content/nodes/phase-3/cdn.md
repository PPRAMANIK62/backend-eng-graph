---
id: cdn
title: CDNs
depth: deep
phase: 3
note: >-
  Caches at the edge, near users. What they can and can't serve.
needs: [anycast, reverse-proxy, http-caching]
leads_to: []
compare_with: []
---


# CDNs

A content delivery network is a large set of [[reverse-proxy|reverse
proxies]] with caches, spread over many locations, sitting in front of
your servers. Users connect to one near them, and anything that one
already has stored is answered there without a trip to your servers.
That makes static files fast and takes load off your origin, but only
for responses that are safe to share between users, and only for as
long as you let them be stored.

## One request, from the edge to the origin

Say your site's JavaScript lives at `https://static.example/app.js`,
your servers (the **origin**) are in one region, and a user is on
another continent.

1. The user's browser looks up `static.example` and gets an address
   the CDN announces from many locations at once. Routing delivers the
   browser to a nearby location, often called a PoP (point of
   presence). That's [[anycast]].
2. The browser does its [[tcp-handshake|TCP]] and [[tls|TLS]] handshakes with that PoP,
   so those round trips are short ones.
3. The PoP works out the request's **cache key**, mostly the URL, and
   looks it up.
4. **Hit:** the file is there and still fresh. The PoP answers at once.
   Your origin never hears about it.
5. **Miss:** the PoP asks the origin, or first another layer of the CDN,
   sends the response to the user, and stores a copy for the next
   person.

![Users on the left connect to the nearest of three edge locations. Two are hits and answer from their own cache. The third misses, asks an upper-tier location, which also misses and fetches from the origin on the right. The response is stored at the upper tier and the edge on the way back. A note says only the upper tier talks to the origin.](img/cdn-edge-tiers.svg)

*Edges answer hits themselves; misses go through an upper tier, so the origin sees few requests and few connections. Adapted from Cloudflare, "Tiered Cache" (Cloudflare docs).*

The first request for a file at each location is a miss. Each PoP has
its own cache, so a file that's popular in one city can be cold in
another.

## What gets stored, and for how long

A CDN is a **shared cache** in HTTP's terms: one stored response serves
many users. What it may store and for how long follows the standard
[[http-caching]] rules (RFC 9111, 2022). In short: nothing marked
`no-store` or `private`, nothing for a request with `Authorization`
unless the response allows it, fresh for `s-maxage` (or else `max-age`),
and revalidated with the origin once stale.

Real CDNs add their own defaults on top. Cloudflare, as documented when
this was written:

- decides by **file extension**, not by content type, and doesn't cache
  HTML or JSON unless you add a rule;
- doesn't cache a response that has a `Set-Cookie` header, or has
  `private`, `no-store`, `no-cache` or `max-age=0`;
- caches only GET;
- when the origin sends no lifetime, keeps 200, 206 and 301 responses
  for 120 minutes, 302 and 303 for 20, 404 and 410 for 3, and nothing
  else.

So a JSON API behind a CDN is usually not cached at all until you say
so, and an image with no headers is cached for two hours.

Browsers cache too, and you may want the CDN to keep something longer
than browsers do, because you can purge the CDN and you can't purge a
browser. `s-maxage` does part of that. RFC 9213 (2022), written by
people from Akamai, Fastly and Cloudflare, adds a header only CDNs
obey:

```http
Cache-Control: max-age=60
CDN-Cache-Control: max-age=86400
```

## The cache key decides what counts as the same thing

The cache key is at least the method and the URL, and many caches use
the URL alone, since they only cache GET anyway. Two consequences:

- **Different URLs, different entries.** `app.js?v=1` and `app.js?v=2`
  are two objects, even if the bytes are identical. That's handy for
  versioning, and wasteful when a tracking parameter makes every URL
  unique.
- **Same URL, same answer for everyone.** If a response depends on who
  is asking, the URL alone isn't enough. `Vary` adds request headers to
  the key, such as `Vary: Accept-Encoding` (see [[http-caching]]).

Anything personal that ends up stored under a plain URL key is served
to the next person who asks for that URL. That's why the defaults
above refuse responses with cookies or credentials.

## Misses are where the origin gets hurt

A popular file that expires, or a new release, can send a burst of
misses at once. CDNs have two tools against that.

**Request collapsing.** When many requests for the same missing object
arrive together at one location, only the first goes to the origin.
The rest wait and get the same response. Cloudflare does this with a
cache lock per data center. Fastly's cache collapses requests too,
and can stream the response to the first user while writing it to
cache.

**Tiers.** Without them, every location with a miss asks the origin.
With a tiered cache, locations near users (lower tiers) ask a few
upper-tier locations, and only those ask the origin. The origin sees
fewer requests and fewer connections. Cloudflare can pick the upper
tier by measured latency to your origin; move your origin and the
upper tier may move too, with a burst of misses while it refills.

A CDN cache is also not storage. Objects expire, and may be evicted
before they expire if they aren't used much.
The origin must always be able to serve everything.

## Getting things out again

There are two ways to change what users get: wait for the lifetime to
run out, or **purge**. On Fastly, when this was written:

- a single URL purges in around 150 ms;
- a **surrogate key** purge removes every object tagged with a key
  (the origin tags responses with a `Surrogate-Key` header, which Fastly
  strips before users see it), also in around 150 ms. Tag every page
  that shows product 724253 with `product-724253`, and one call clears
  them all;
- purging everything takes up to 2 minutes, and on a busy site sends a
  rush of traffic to the origin;
- a **soft purge** marks objects stale instead of deleting them, so they
  can still be revalidated or served if the origin struggles.

Fast purging is what makes long CDN lifetimes safe. Without it, every
lifetime is a guess at how long you can live with old content.

## What a CDN can't serve for you

- **Responses for one user.** Anything marked `private`, anything that
  sets a cookie, anything behind `Authorization` goes to the origin
  every time, unless you work hard to split the shared part out.
- **Writes.** POST, PUT and DELETE pass through to the origin. A cache
  that sees a successful unsafe request for a URL must drop what it
  stored for that URL.
- **Anything that must be current right now,** unless you purge on
  every change.

Even then, traffic that can't be cached still benefits: the TLS
handshake happens with a nearby PoP, and with tiers your origin talks
to a few CDN locations over a small number of connections instead of
to every user. Keeping those connections open and reusing them is
[[connection-pooling]].

## Where it gets tricky

**TCP over anycast isn't guaranteed to hold.** If routes change
mid-connection, packets can reach a different PoP that has never seen
the connection. CDNs run TCP over anycast anyway because routes are
usually stable for much longer than a connection lasts. The details are
in [[anycast]].

**Caches spread mistakes.** A shared cache hands one stored response to
many users, so one bad response goes a long way. Cache poisoning means
getting a harmful response stored, and one common way in is a parsing
difference between the CDN and the origin, which is
[[request-smuggling]]. A CDN is a chain of proxies in front of your
origin, so it's exactly the setup where that can happen.

**Defaults differ from the standard.** RFC 9111 treats reuse as the
default whenever nothing forbids it, and allows heuristic lifetimes.
Cloudflare instead ignores HTML and JSON by default and caches by
extension. Read your CDN's rules; don't assume the RFC.

**Your origin sees the CDN, not the user.** Every request arrives from
a CDN address, so the client address comes in a header
([[client-ip-forwarding]]), and your origin should accept traffic only
from the CDN, or attackers can go around it.

## What this means when you build

- Put a version or content hash in static file names and give them a
  long lifetime. Nothing ever needs purging.
- Send explicit `Cache-Control` on everything. Use `private` or
  `no-store` for anything personal, and never set cookies on shared
  responses.
- Tag responses with keys you can purge by, and purge on change instead
  of choosing short lifetimes.
- Keep query strings and `Vary` under control, or the hit ratio drops.
- Size the origin for a full purge or a cold cache, not for the normal
  hit ratio.

## Further reading

- [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111), R. Fielding, M. Nottingham, J. Reschke (editors), IETF, 2022. HTTP caching: shared caches, the cache key, freshness, and when a response may be stored.
- [RFC 9213](https://www.rfc-editor.org/rfc/rfc9213), S. Ludin, M. Nottingham, Y. Wu, IETF, 2022. `CDN-Cache-Control`, and why CDNs get their own lifetimes.
- [RFC 7094: Architectural Considerations of IP Anycast](https://www.rfc-editor.org/rfc/rfc7094), D. McPherson et al., IAB, 2014. Why TCP over anycast isn't guaranteed to hold, and why CDNs run it anyway.
- [Default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/), Cloudflare docs. What a large CDN caches with no configuration, and request collapsing.
- [Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/), Cloudflare docs. Lower and upper tiers, and how they protect the origin.
- [Caching content with Fastly](https://www.fastly.com/documentation/guides/concepts/edge-state/cache/), Fastly docs. How an edge cache fills, collapses requests and revalidates, and why it isn't storage.
- [Purging](https://www.fastly.com/documentation/guides/concepts/edge-state/cache/purging/), Fastly docs. URL, surrogate-key and full purges, soft purges, and how long each takes.
