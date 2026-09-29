---
id: antirez-lazy-redis-2015
title: Lazy Redis is better Redis
author: Salvatore Sanfilippo (antirez)
url: http://antirez.com/news/93
kind: blog
primary: true
---

## Summary

Redis's creator on building lazy freeing (UNLINK), around the Redis 3.2
and 4.0 work (the post was about 4,021 days old when read, so 2015). How a
single-threaded server avoids long stalls by doing work incrementally,
why freeing big values moved to a background thread, and why that
change opened the door to threaded I/O later.

## Key claims

- Redis is only partly single-threaded: side threads existed for slow disk work (bio.c). "our small library to perform asynchronous tasks on a different thread was called bio.c: Background I/O, basically." (intro)
- Deleting a huge key used to block the server for seconds. "if you send Redis “DEL mykey” and your key happens to have 50 million objects, the server will block for seconds without serving anything in the meantime." (intro)
- The rule of thumb: fast as long as you use O(1) and O(log N) commands. "Redis is very fast as long as you use O(1) and O(log_N) commands." (intro)
- A single-threaded server avoids stalls by doing work in small steps. "In a single-threaded server the easy way to make operations non-blocking is to do things incrementally instead of stopping the world." (The first attempt)
- Eviction, expiry and hash-table rehashing already worked that way. "LRU eviction and keys expires are two obvious examples, but there are more, like incremental rehashing of hash tables." (The first attempt)
- Redis performance is dominated by cache misses. "However Redis performance is dominated by cache misses, so maybe we can compensate this with one indirection less?" (main text, before "A note about the API")
- UNLINK frees small values at once and big ones in the background. "UNLINK is a smart command: it calculates the deallocation cost of an object, and if it is very small it will just do what DEL is supposed to do and free the object ASAP." (A note about the API)
- Unsharing objects made threaded I/O possible, with only the database access on one lock. "it is finally possible to implement threaded I/O in Redis, so that different clients are served by different threads." (Not just lazy freeing)
- A threaded Redis full of mutexes was always seen as a bad idea. "In the past a threaded Redis was always seen as a bad idea if thought as a set of mutexes in data structures and objects in order to implement concurrent access" (Not just lazy freeing)
- Removing the robj indirection made every tested operation faster. "Less indirection was a real winner here." (Not just lazy freeing, just before it)

## Visuals worth redrawing

None.

## My notes

- The plan in the post (targeting 3.4) is out of date; UNLINK shipped in
  4.0 per the Redis FAQ ("As of version 4.0, Redis has started
  implementing threaded actions"). Don't cite version numbers from the
  post's ETA section.
