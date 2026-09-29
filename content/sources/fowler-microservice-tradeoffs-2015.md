---
id: fowler-microservice-tradeoffs-2015
title: Microservice Trade-Offs
author: Martin Fowler
url: https://martinfowler.com/articles/microservice-trade-offs.html
kind: blog
primary: true
---

## Summary

Fowler's list (2015) of what microservices buy (strong module
boundaries, independent deployment, technology diversity) and what they
cost (distribution, eventual consistency, operational complexity), with
the caveats on each. The best short summary of the trade-off.

## Key claims

- Benefit: strong module boundaries. "Strong Module Boundaries: Microservices reinforce modular structure, which is particularly important for larger teams." (summary list)
- Benefit: independent deployment. "Independent Deployment: Simple services are easier to deploy, and since they are autonomous, are less likely to cause system failures when they go wrong." (summary list)
- Cost: distribution. "Distribution: Distributed systems are harder to program, since remote calls are slow and are always at risk of failure." (summary list)
- Cost: eventual consistency. "Eventual Consistency: Maintaining strong consistency is extremely difficult for a distributed system, which means everyone has to manage eventual consistency." (summary list)
- Cost: operations. "Operational Complexity: You need a mature operations team to manage lots of services, which are being redeployed regularly." (summary list)
- In theory a monolith can be just as modular; services make the boundary harder to sneak around. "The trouble is that, with a monolithic system, it's usually pretty easy to sneak around the barrier." (Strong Module Boundaries)
- Each service owning its data removes integration databases. "This eliminates Integration Databases, which are a major source of nasty coupling in larger systems." (Strong Module Boundaries)
- Wrong boundaries turn the benefit into a handicap. "This advantage becomes a handicap if you don't get your boundaries right." (Strong Module Boundaries)
- Chained remote calls add up. "If your service calls half-a-dozen remote services, each which calls another half-a-dozen remote services, these response times add up to some horrible latency characteristics." (Distribution)
- Parallel async calls cost only the slowest, but async code is hard. "If make six asynchronous calls in parallel you're now only as slow as the slowest call instead of the sum of their latencies." (Distribution)
- Any remote call can fail. "You expect in-process function calls to work, but a remote call can fail at any time." (Distribution)
- In a monolith you can update many things in one transaction. "With a monolith, you can update a bunch of things together in a single transaction." (Eventual Consistency)
- Large monoliths can be delivered continuously too. "even large monoliths can be delivered continuously too. Facebook and Etsy are the two best known cases." (Independent Deployment)
- Services that must be deployed together are a common failure. "many teams that attempt a microservice architecture get into trouble because they end up having to coordinate service deployments." (Independent Deployment, footnote 2)
- Complexity moves to the connections. "the danger is that complexity isn't eliminated, it's merely shifted around to the interconnections between services." (Operational Complexity)
- Continuous delivery becomes essential. "There's just no way to handle dozens of services without the automation and collaboration that continuous delivery fosters." (Operational Complexity)

## Visuals worth redrawing

None.

## My notes

- Pairs with MonolithFirst (2015) and MicroservicePremium (2015) from
  the same author.
