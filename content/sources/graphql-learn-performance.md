---
id: graphql-learn-performance
title: "Learn GraphQL: Performance"
author: GraphQL Foundation (graphql.org)
url: https://graphql.org/learn/performance/
kind: docs
primary: true
---

## Summary

The graphql.org learn page on performance: caching over HTTP with GET
and persisted queries, the N+1 problem and batching, demand control,
compression and monitoring.

## Key claims

- The claim that GraphQL is as cacheable as any parameterized API. "In practice, however, GraphQL is as cacheable as any API that enables parameterized requests, such as a REST API that allows clients to specify different query parameters for a particular endpoint." (intro)
- POST is supported by default; GET may be supported for queries. "GraphQL implementations that adhere to the GraphQL over HTTP specification will support the POST HTTP method by default, but may also support GET requests for query operations." (GET requests for queries)
- GET helps HTTP caches and CDNs. "Using GET can improve query performance because requests made with this HTTP method are typically considered cacheable by default and can help facilitate HTTP caching or the use of a content delivery network (CDN)" (GET requests for queries)
- URL size limits push large queries to persisted queries, sent as a hash. "Using persisted queries, either in the form of trusted documents or automatic persisted queries, will allow the client to send a hash of the query instead" (GET requests for queries)
- One focused function per field can make a naive server "chatty". "without additional consideration, a naive GraphQL service could be very “chatty” or repeatedly load data from your databases." (The N+1 Problem)
- The N+1 problem, defined. "This is known as the N+1 problem, where an initial request to an underlying data source (for a hero’s friends) leads to N subsequent requests to resolve the data for all of the requested fields" (The N+1 Problem)
- Usually solved by batching, e.g. with DataLoader. "This is commonly solved by a batching technique, where multiple requests for data from a backend are collected over a short period and then dispatched in a single request" (The N+1 Problem)
- Clients can send very expensive operations, by accident or on purpose. "it may be possible for clients to request highly complex operations that place excessive load on the underlying data sources during execution." (Demand control)
- Demand control tools: paginated lists, depth and breadth limits, complexity analysis. "such as paginating list fields, limiting operation depth and breadth, and query complexity analysis." (Demand control)
- Responses are usually JSON, which compresses well. "GraphQL services typically respond using JSON even though the GraphQL spec does not require it." (JSON (with GZIP))
- Every field gets its own focused resolver function. "GraphQL is designed in a way that allows you to write clean code on the server, where every field on every type has a focused single-purpose function for resolving that value." (The N+1 Problem)
- GraphQL is served through a single endpoint. "At first glance, GraphQL requests may seem challenging to cache given that the API is served through a single endpoint and you may not know in advance what fields a client will include in an operation." (intro)

## Visuals worth redrawing

None.

## My notes

- The "as cacheable as any API" claim sits next to the admission that
  URL limits force persisted queries for GET; the two together are the
  honest picture.
