---
id: graphql-dataloader
title: DataLoader (README)
author: GraphQL Foundation (DataLoader contributors)
url: https://github.com/graphql/dataloader
kind: code
primary: true
---

## Summary

The README of DataLoader, the JavaScript batching and per-request
caching utility that grew out of Facebook's "Loader" API and is the
usual fix for N+1 in GraphQL servers.

## Key claims

- What it is: batching and caching over data sources. "DataLoader is a generic utility to be used as part of your application's data fetching layer to provide a simplified and consistent API over various remote data sources such as databases or web services via batching and caching." (intro)
- It comes from Facebook's "Loader" API, which underpinned their GraphQL server. "This ultimately became the underpinning for Facebook's GraphQL server implementation and type definitions." (intro)
- Batching is the main feature. "Batching is not an advanced feature, it's DataLoader's primary feature." (Batching)
- Loads in one tick of the event loop are coalesced into one batch call. "DataLoader will coalesce all individual loads which occur within a single frame of execution (a single tick of the event loop) and then call your batch function with all requested keys." (Batching)
- Example: four round trips become at most two. "A naive application may have issued four round-trips to a backend for the required information, but with DataLoader this application will make at most two." (Batching)
- The batch function must return one value per key, in key order. "The Array of values must be the same length as the Array of keys." (Batch Function)
- Its cache is per request, not a shared cache. "DataLoader caching _does not_ replace Redis, Memcache, or any other shared application-level cache." (Caching Per-Request)
- Create loaders per request when users can see different things. "Typically instances are created per request when used within a web-server like [express][] if different users can see different things." (Getting Started)
- The cache only stops the same key being loaded twice in one request. "its cache only serves the purpose of not repeatedly loading the same data in the context of a single request to your Application." (Caching Per-Request)
- Sharing one loader between users can leak data between them. "Avoid multiple requests from different users using the DataLoader instance, which could result in cached data incorrectly appearing in each request." (Caching Per-Request)
- It's published as a reference implementation of the idea, to be ported. "as a publicly available reference implementation of this concept in the hopes that it can be ported to other languages." (intro)

## Visuals worth redrawing

None.

## My notes

- Read from the main branch README. Ports exist in other languages;
  none opened.
