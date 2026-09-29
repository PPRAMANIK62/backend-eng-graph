---
id: lewis-fowler-microservices-2014
title: "Microservices: a definition of this new architectural term"
author: James Lewis and Martin Fowler
url: https://martinfowler.com/articles/microservices.html
kind: blog
primary: true
---

## Summary

The article (2014) that gave the microservice style its common
description: an application built as a suite of small, independently
deployable services, organised around business capabilities, each
managing its own data, talking over lightweight mechanisms. It compares
the style with a monolith and lists its common characteristics.

## Key claims

- The definition. "an approach to developing a single application as a suite of small services, each running in its own process and communicating with lightweight mechanisms, often an HTTP resource API." (intro)
- Built around business capabilities and deployed independently. "These services are built around business capabilities and independently deployable by fully automated deployment machinery." (intro)
- A monolith is one logical executable. "This server-side application is a monolith - a single logical executable" (intro)
- Any change means redeploying the whole monolith. "Any changes to the system involve building and deploying a new version of the server-side application." (intro)
- A monolith can scale horizontally behind a load balancer. "You can horizontally scale the monolith by running many instances behind a load-balancer." (intro)
- The frustrations: coupled change cycles, eroding modularity, scaling everything together. "Scaling requires scaling of the entire application rather than parts of it that require greater resource." (intro)
- Services are out-of-process components, unlike libraries. "services are out-of-process components who communicate with a mechanism such as a web service request, or remote procedure call." (Componentization via Services)
- Remote calls cost more, so APIs get coarser. "Remote calls are more expensive than in-process calls, and thus remote APIs need to be coarser-grained, which is often more awkward to use." (Componentization via Services)
- Conway's Law, quoted. "Any organization that designs a system (defined broadly) will produce a design whose structure is a copy of the organization's communication structure." (Organized around Business Capabilities)
- Each service manages its own database. "Microservices prefer letting each service manage its own database" (Decentralized Data Management)
- Distributed transactions are avoided; consistency may only be eventual. "microservice architectures emphasize transactionless coordination between services, with explicit recognition that consistency may only be eventual consistency and problems are dealt with by compensating operations." (Decentralized Data Management)
- A naive split of in-process calls into RPC is chatty. "A naive conversion from in-memory method calls to RPC leads to chatty communications which don't perform well." (Smart endpoints and dumb pipes)
- Team sizes seen: up to about a dozen people per service (Amazon's two-pizza team). "meaning no more than a dozen people" (Organized around Business Capabilities)
- Services give firm module boundaries and can be owned by different teams. "They can also be managed by different teams ." (intro)

## Visuals worth redrawing

- The monolith vs microservices figure (one process with all functions,
  scaled by copying the whole, vs services scaled separately).

## My notes

- Primary for the definition; the authors coined the common description.
