---
id: google-aip-121
title: "AIP-121: Resource-oriented design"
author: Google API Improvement Proposals (AIP) authors
url: https://google.aip.dev/121
kind: docs
primary: true
---

## Summary

Google's core API design rule, written by the team that reviews
Google's APIs. An API is a hierarchy of named resources (nouns) with a
few standard methods (verbs) on each, plus custom methods when the
standard ones don't fit. It borrows from REST but is written as a
pattern for RPC APIs.

## Key claims

- Three principles: named resources, a few standard methods, and a stateless protocol. "The fundamental building blocks of an API are individually-named resources (nouns) and the relationships and hierarchy that exist between them." (intro)
- Standard methods cover most operations; custom methods for the rest. "A small number of standard methods (verbs) provide the semantics for most common operations. However, custom methods are available in situations where the standard methods do not fit." (intro)
- It borrows from REST. "resource-oriented design borrows many principles from REST, while also defining its own patterns where appropriate." (intro)
- The design order: resources, relationships, schema, then methods. "The methods (verbs) each resource provides, relying as much as possible on the standard verbs." (Guidance)
- An API is a hierarchy of resources and collections. "A resource-oriented API should generally be modeled as a resource hierarchy, where each node is either a simple resource or a collection of resources." (Resources)
- Mirroring the database schema is an anti-pattern. "In fact, having an API that is identical to the underlying database schema is actually an anti-pattern, as it tightly couples the surface to the underlying system." (Resources)
- Many resources, few methods. "A typical resource-oriented API exposes a large number of resources with a small number of methods on each resource." (Methods)
- The five standard methods are Get, List, Create, Update, Delete. "The methods can be either the standard methods (Get, List, Create, Update, Delete), or custom methods." (Methods)
- The resource's schema must be the same across all methods. "the resource schema for that resource across all methods must be the same." (Methods)
- Every resource needs Get, so a client can check the state after a change. "A resource must support at minimum Get: clients must be able to validate the state of resources after performing a mutation such as Create, Update, or Delete." (Methods)
- Every resource needs List, except singletons. "A resource must also support List, except for singleton resources where more than one resource is not possible." (Methods)
- A custom method is not a new HTTP verb; it's usually POST with the verb in the URI. "Custom methods use traditional HTTP verbs (usually POST) and define the custom verb in the URI." (Methods, note)
- Prefer standard methods. "APIs should prefer standard methods over custom methods" (Methods)
- On the management plane, a finished operation means the resource has reached a steady state. "Following a successful create that is the latest mutation on a resource, a get request for a resource must return the resource." (Strong Consistency)
- Why: clients chain operations and use completion as the signal to go on. "ensuring that resources immediately reflect steady user state after an operation is complete ensures clients can rely on method completion as a signal to begin the next operation." (Strong Consistency)
- Stateless: each request stands alone, and resources are directly addressable. "each request happens in isolation of other requests made by that client or another, and resources exposed by an API are directly addressable without needing to apply a series of specific requests to \"reach\" the desired resource." (Stateless protocol)
- The client owns application state; the server owns persisted data. "clients have sole responsibility and authority for maintaining the application state." (Stateless protocol)
- References between resources must not form cycles. "The relationship between resources, such as with resource references, must be representable via a directed acyclic graph." (Cyclic References)
- After a delete, a get returns not-found (or the soft-deleted resource). "Following a successful delete that is the latest mutation on a resource, a get request for a resource must return NOT_FOUND" (Strong Consistency)
- A cycle between A and B takes three calls to create: create A, create B pointing at A, update A. "update resource A with the reference to B." (Cyclic References, step 3)
- Deleting cyclic resources needs care about order. "The delete operation may also become more complex, due to reasoning about which resource must be dereferenced first for a successful deletion." (Cyclic References)
- AIPs are a pattern for RPC APIs. "Resource-oriented design is a pattern for specifying RPC APIs" (intro)

## Visuals worth redrawing

- The standard method table (request contains / response is the
  resource). Folded into the api-design figure.

## My notes

- AIPs are written for gRPC/protobuf APIs with an HTTP mapping
  (AIP-127). The HTTP side is in AIP-136's examples.
