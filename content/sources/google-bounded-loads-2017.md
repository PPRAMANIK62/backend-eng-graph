---
id: google-bounded-loads-2017
title: Consistent Hashing with Bounded Loads (Google Research blog)
author: Vahab Mirrokni and Morteza Zadimoghaddam (Google)
url: https://research.google/blog/consistent-hashing-with-bounded-loads/
kind: blog
primary: true
---

## Summary

The 2017 blog post explaining the bounded-loads paper in plain words,
with a worked example of six keys and three servers of capacity two,
and the story of Vimeo adding it to HAProxy.

## Key claims

- Keys walk clockwise to the first server with room. "Then each ball is moved clockwise and is assigned to the first bin with spare capacity." (The Algorithm)
- The cap holds for every server. "Furthermore, for any value of ε, we know the load of each bin is at most (1+ε) times the average load." (The Algorithm)
- Smaller ε means more even load but more movement. "As one can see there is a tradeoff — a lower ε helps with uniformity but not with consistency, while larger ε values help with consistency." (The Algorithm)
- Vimeo put it into HAProxy. "implemented it in haproxy (a widely-used piece of open source software)" (intro)
- Vimeo's result: cache bandwidth down by almost 8 times. "applying these algorithmic ideas helped them decrease the cache bandwidth by a factor of almost 8, eliminating a scaling bottleneck." (intro)
- The number of moves per update doesn't grow with the system. "The most important thing about this upper bound is that it is independent of the total number of balls or bins in the system." (The Algorithm)
- Google put it in Cloud Pub/Sub. "We then worked with our Cloud team to implement it in Google Cloud Pub/Sub" (intro)

## Visuals worth redrawing

- The six balls, three bins example on a circle (capacity 2, ball 6
  skips two full bins). Good for a bounded-loads figure.

## My notes

- Vimeo's own post (Andrew Rodland) is on medium.com and wouldn't open.
