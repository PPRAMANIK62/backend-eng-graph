---
id: graphql-spec-2025
title: GraphQL specification (2025 edition)
author: GraphQL Specification Project (GraphQL Foundation)
url: https://spec.graphql.org/September2025/
kind: spec
primary: true
---

## Summary

The 2025 edition of the GraphQL spec: the query language, the type
system, introspection, validation, execution and the response format.
It defines what a resolver is and how the executor walks the query, and
leaves transport to others (see graphql-over-http).

## Key claims

- What it is: a query language and execution engine. "a query language and execution engine for describing and performing the capabilities and requirements of data models for client-server applications." (Introduction)
- History: created in 2012, open standard work since 2015. "GraphQL was originally created in 2012 and the development of this open standard started in 2015." (Introduction)
- The first example: ask for a user's name, get JSON in the same shape. "{ user(id: 4) { name } }" (1 Overview, Example 1)
- The request is shaped like the response. "The request is shaped just like the data in its response." (1 Overview, Hierarchical)
- Strong typing lets tools validate a query before it runs. "Given a GraphQL operation, tools can ensure that it is both syntactically correct and valid within that type system before execution" (1 Overview, Strong-typing)
- The client decides the shape, and gets no more than it asked for. "A GraphQL response, on the other hand, contains exactly what a client asks for and no more." (1 Overview, Client-specified response)
- The schema can be queried through GraphQL itself (introspection). "GraphQL is self-describing and introspective." (1 Overview, Self-describing)
- No transport is required by the spec. "GraphQL requests do not require any specific serialization format or transport mechanism." (6 Execution, note)
- Top-level mutation fields run one after another, to avoid races. "Serial execution of the provided mutations ensures against race conditions during these side-effects." (6.2.2)
- Other fields may run in any order, even in parallel, because they must have no side effects. "Because the resolution of fields other than top-level mutation fields must always be side effect-free and idempotent, the execution order must not affect the result" (6.3.4)
- A resolver is the function that produces a field's value. "Let resolver be the internal function provided by objectType for determining the resolved value of a field named fieldName." (6.4.2)
- Resolvers are often asynchronous because they read databases or services. "It is common for resolver to be asynchronous due to relying on reading an underlying database or networked service to produce a value." (6.4.2, note)
- Object-typed fields recurse into their sub-selections. "If the return type is another Object type, then the field execution process continues recursively by collecting and executing subfields." (6.4.3)
- An error on a non-null position propagates to the parent. "then that error must propagate to the parent response position" (6.3.3, Errors and Non-Null Types)
- A response can carry partial data and a list of errors. "A response may contain both a partial response as well as a list of errors in the case that any execution error was raised and replaced with null." (7)
- Errors go in an "errors" entry, absent if there were none. "If the request completed without raising any errors, this entry must not be present." (7.1.1)
- Fields can be marked deprecated. (3.6.2 Field Deprecation, section title)
- The spec's first example runs against Facebook's implementation. "For example, this GraphQL request will receive the name of the user with id 4 from the Facebook implementation of GraphQL." (1 Overview)
- Without GraphQL, the server usually decides the shape of each endpoint's data. "In the majority of client-server applications written without GraphQL, the service determines the shape of data returned from its various endpoints." (1 Overview, Client-specified response)
- A document holds operations (queries, mutations, subscriptions) and fragments. "A document may contain operations (queries, mutations, and subscriptions) as well as fragments, a common unit of composition allowing for data requirement reuse." (2 Language)
- A request error (before execution) returns no data at all. "The request error result map must not contain an entry with key \"data\"." (7.1.3)
- Subscriptions return a stream of results, one per event. "Additionally, for each event in a subscription’s source stream, the response stream will emit an execution result." (7.1.1)
- Introspection is the base for developer tools and client libraries. "GraphQL introspection serves as a powerful platform for building common developer tools and client software libraries." (1 Overview, Self-describing)
- The response to the first example. "{ \"user\": { \"name\": \"Mark Zuckerberg\" } }" (1 Overview, Example 2)

## Visuals worth redrawing

None.

## My notes

- The URL names the edition by month; the notes say "2025 edition".
- The spec says nothing about caching, rate limiting or N+1; those are
  in graphql.org's learn pages.
