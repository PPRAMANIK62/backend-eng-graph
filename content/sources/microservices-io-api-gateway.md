---
id: microservices-io-api-gateway
title: "Pattern: API Gateway / Backends for Frontends"
author: Chris Richardson
url: https://microservices.io/patterns/apigateway.html
kind: docs
primary: true
---

## Summary

The API gateway pattern as written up on microservices.io: one entry
point for all clients of a microservice system, which routes some
requests and fans others out to several services, with the Backends for
Frontends variant (one gateway per kind of client).

## Key claims

- The problem: service APIs are fine-grained, clients need coarser ones, and different clients need different data. "The granularity of APIs provided by microservices is often different than what a client needs." (Forces)
- Where services live and how the system is split changes, and clients shouldn't see it. "Partitioning into services can change over time and should be hidden from clients" (Forces)
- Desktop pages show more than mobile ones. "For example, the desktop browser version of a product details page desktop is typically more elaborate then the mobile version." (Forces)
- Drawback: one more moving part. "Increased complexity - the API gateway is yet another moving part that must be developed, deployed and managed" (Resulting context)
- The gateway is the single entry point; it proxies some requests and fans out others. "Implement an API gateway that is the single entry point for all clients." (Solution)
- "Some requests are simply proxied/routed to the appropriate service. It handles other requests by fanning out to multiple services." (Solution)
- It may also check authorization. "The API gateway might also implement security, e.g. verify that the client is authorized to perform the request" (Solution)
- Backends for Frontends: one gateway per kind of client. "A variation of this pattern is the Backends for frontends pattern. It defines a separate API gateway for each kind of client." (Variation: Backends for frontends)
- Benefits: hides how the system is split and where instances are, fewer round trips, protocol translation. "Reduces the number of requests/roundtrips." (Resulting context)
- Drawbacks: another thing to build and run, and an extra hop. "Increased response time due to the additional network hop through the API gateway" (Resulting context)
- It authenticates and passes a token on; it uses service discovery and circuit breakers. "The API Gateway may authenticate the user and pass an Access Token containing information about the user to the services" (Related patterns)

- It calls services through circuit breakers. "An API Gateway will use a Circuit Breaker to invoke services" (Related patterns)
- The mobile case: fewer round trips over a slower network. "An API gateway is essential for mobile applications." (Resulting context)

## Visuals worth redrawing

- The pattern's diagram (clients → gateway → services) and the BFF
  version with one gateway per client type.

## My notes

- Primary for the pattern: Richardson wrote it up and named the BFF
  variation here. Not about any one product.
