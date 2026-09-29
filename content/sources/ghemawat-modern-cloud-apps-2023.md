---
id: ghemawat-modern-cloud-apps-2023
title: Towards Modern Development of Cloud Applications
author: Sanjay Ghemawat, Robert Grandl, Srdjan Petrovic, Michael Whittaker, Parveen Patel, Ivan Posva, Amin Vahdat (Google)
url: https://sigops.org/s/conferences/hotos/2023/papers/ghemawat.pdf
kind: paper
primary: true
---

## Summary

A HotOS 2023 position paper from Google arguing that microservices mix up
two things: how code is split logically and how it's deployed. It
proposes writing a modular monolith of components, letting a runtime
decide which components share a process, and deploying the whole
application at once. The prototype, in Go, is published as Service
Weaver.

## Key claims

- Why developers split into many binaries (from an internal survey): performance, fault tolerance, abstraction boundaries, flexible rollouts. "(1) It improves performance." (Introduction)
- C1, performance: serialization and network overhead. "The overhead of serializing data and sending it across the network is increasingly becoming a bottleneck" (Introduction, C1)
- C2, correctness: interactions between versions. "In a case study of over 100 catastrophic failures of eight widely used systems, two-thirds of failures were caused by the interactions between multiple versions of a system" (Introduction, C2)
- C3, hard to manage: n binaries, n release schedules. "Running end-to-end tests with a local instance of the application becomes an engineering feat." (Introduction, C3)
- C4, APIs freeze. "Once a microservice establishes an API, it becomes hard to change without breaking the other services that consume the API." (Introduction, C4)
- C5, slower development: no atomic cross-service changes. "When making changes that affect multiple microservices, developers cannot implement and deploy the changes atomically." (Introduction, C5)
- The core diagnosis. "Fundamentally, this is because microservices conflate logical boundaries (how code is written) with physical boundaries (how code is deployed)." (Abstract)
- The proposal: logical monoliths, a runtime that places components, atomic deploys. "Deploy applications atomically, preventing different versions of an application from interacting." (Section 2, tenet 3)
- Component calls are RPCs only when needed. "Component method invocations turn into remote procedure calls where necessary, but remain local procedure calls if the caller and callee component are in the same process." (3.1)
- The prototype is public. "Our implementation is available at github.com/ServiceWeaver." (5.5)
- Evaluation setup: a popular eleven-microservice web app, ported to Go, load-tested with Locust at a steady rate, both versions autoscaled. "The application has eleven microservices and uses gRPC [18] and Kubernetes [25] to deploy on the cloud." (6.1)
- Table 2 at 10,000 QPS: 28 cores and 2.66 ms median latency for the prototype, 78 cores and 5.47 ms for the baseline, with no components co-located. (6.1, Table 2)
- Co-locating all eleven components in one process: 9 cores, 0.38 ms median. "the number of cores drops to 9 and the median latency drops to 0.38 ms, both an order of magnitude lower than the baseline." (6.1)
- Most of the gain comes from a serialization format that needs no versioning. "Most of the performance benefits of our prototype come from its use of a custom serialization format designed for nonversioned data exchange" (6.1)
- Shared persistent state still couples versions. "These cross-version interactions are unavoidable—persistent state, by definition, persists across versions" (5.4)
- Their prototype's result, against the status quo. "Our prototype implementation reduces application latency by up to 15× and reduces cost by up to 9× compared to the status quo." (Abstract)
- Reason (2) from the survey, fault tolerance. "A crash in one microservice doesn’t bring down other microservices, limiting the blast radius of bugs." (Introduction)

## Visuals worth redrawing

- Figure 1: components A, B, C written as one program, placed by the
  runtime onto processes on two machines.

## My notes

- The 15× and 9× are for their prototype on their benchmark, per the
  paper; don't generalise. The two-thirds figure is cited from another
  study (their reference 78), not measured here.
