---
id: graceful-degradation
title: Graceful degradation
depth: short
phase: 13
note: >-
  Turning off the nice-to-have parts to keep the core working.
needs: [load-shedding]
leads_to: []
compare_with: [circuit-breakers]
---

# Graceful degradation

Graceful degradation means answering with less instead of failing:
when a service is short of capacity, it switches off the parts of a
response that are nice to have and keeps the part people came for.
[[load-shedding|Load shedding]] turns some requests away; graceful
degradation makes each request cheaper, so more of them can be served.

## Less work per request

Take a search service. Normally it searches the whole index on disk
and ranks results with its full algorithm. Under overload it could
search only the part of the data held in memory, or rank with a
faster, less accurate algorithm. The user still gets results, a bit
worse, and each query costs much less.

Take a made-up Shakespeare search service, the running example in
Google's SRE book. When a documentary sends a surge of traffic its way,
the service stops returning pictures and small maps next to the text.
Pictures that time out aren't retried either. The text, which is what
people wanted, keeps working.

The pattern works when a response is really several parts with
different value: the search results and the spelling suggestions
beside them, the text and its pictures. When capacity runs out, the extras go first.

Degrading has to be built in advance. You can only switch to a cheaper
mode if you've written one, and you can only drop the unimportant
parts if the service knows which parts, or which requests, are
unimportant. That's the same decision [[load-shedding]] needs when it
picks what to drop, made per feature instead of per request.

## Degraded modes break

A degraded mode runs rarely, ideally only when capacity planning got
something wrong or load shifted unexpectedly. That's also its weakness.
Code that rarely runs is code that's rarely tested, and when it finally
runs, during an incident, nobody remembers how it works.

The fix is to exercise it on purpose, by keeping a small set of
servers running near overload so the degraded path gets real traffic.
Alert when many servers enter degraded mode, keep the logic simple,
and have a way to switch it off or tune it quickly if it misbehaves.

## Where it gets tricky

**Degrading is not falling back.** Amazon almost never uses fallback:
switching to a different mechanism when the main one fails. The reason
is an outage from around 2001. Amazon's product pages showed
shipping speeds from a cache, and if the cache failed, web servers
queried the supply-chain database directly instead. One day all the
caches failed together, every web server hit the database, and it
locked up. A missing shipping estimate became a whole site that
wouldn't load, and because fulfillment centers used the same database,
they stopped too.

The lesson for degradation: a degraded mode must do *less* work, and
must not move the work onto something else that's already struggling.
Dropping the shipping estimate would have been graceful degradation;
asking the database for it was fallback. The better options are to
make the main path more reliable, let the caller handle the error, or
run both paths all the time so neither is a surprise.

**Manual or automatic.** A degraded mode turned on by hand depends on
someone remembering it exists in the middle of an incident. An
automatic one needs its own trigger, and complex triggers can trip
when you didn't want them to, or set up feedback loops of their own.
The simpler the rule, the easier it is to trust.

## What this means when you build

- For each response, write down which parts are core and which are
  extras, and make the extras optional in the code.
- Give extras short timeouts, and don't retry them.
- Make a degraded mode do less work, never move work onto a dependency
  that may be the thing failing.
- Exercise degraded modes regularly, in production, on a few servers.
- Alert when servers enter a degraded mode, and keep a switch to turn
  it off.

## Further reading

- [Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/), Mike Ulrich, Google SRE book, 2016. Graceful degradation next to load shedding, what to decide before building it, and the Shakespeare example.
- [Avoiding fallback in distributed systems](https://d1.awsstatic.com/builderslibrary/pdfs/avoiding-fallback-in-distributed-systems.pdf), Jacob Gabrielson, Amazon Builders' Library, 2019. Why fallbacks make outages worse, with the shipping-speed cache story, and what to do instead.
