---
id: graphql-learn-caching
title: "Learn GraphQL: Caching"
author: GraphQL Foundation (graphql.org)
url: https://graphql.org/learn/caching/
kind: docs
primary: true
---

## Summary

The graphql.org learn page on caching: GraphQL has no URL per object,
so the API should expose a globally unique id that client caches can
key on.

## Key claims

- In endpoint APIs the URL is the cache key. "The URL in these APIs is a globally unique identifier that the client can leverage to build a cache." (intro)
- GraphQL has no such primitive. "In GraphQL, there’s no URL-like primitive that provides this globally unique identifier for a given object." (intro)
- So expose a globally unique id field. "One possible pattern for this is reserving a field, like id, to be a globally unique identifier." (Globally unique IDs)
- The server can build one from type name plus id, often made opaque with base64. "Oftentimes, that’s as simple as appending the name of the type to the ID and using that as the identifier." (Globally unique IDs)
- A client can also derive it from __typename and a type-unique id. "This could be as simple as combining the type of the object (queried with __typename) with some type-unique identifier." (Alternatives)

## Visuals worth redrawing

None.

## My notes

- This is about client-side normalized caches, not HTTP caches.
