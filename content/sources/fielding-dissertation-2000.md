---
id: fielding-dissertation-2000
title: "Architectural Styles and the Design of Network-based Software Architectures, Chapter 5: Representational State Transfer (REST)"
author: Roy Thomas Fielding
url: https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm
kind: paper
primary: true
---

## Summary

The chapter of Fielding's 2000 PhD dissertation (UC Irvine) that
defines REST. It derives the style by adding constraints one at a time
to an empty style (client-server, stateless, cache, uniform interface,
layered system, optional code-on-demand), saying what each buys and
costs, then defines resources, representations, connectors and
components. Only chapter 5 was read.

## Key claims

- REST is the Web's architectural style, built by adding constraints. "REST consists of a set of architectural constraints chosen for the properties they induce on candidate architectures." (5.1.8)
- Client-server lets the two sides evolve independently. "the separation allows the components to evolve independently, thus supporting the Internet-scale requirement of multiple organizational domains." (5.1.2)
- Stateless: each request carries everything needed; session state lives on the client. "each request from client to server must contain all of the information necessary to understand the request, and cannot take advantage of any stored context on the server. Session state is therefore kept entirely on the client." (5.1.3)
- Statelessness gives visibility, reliability and scalability. "This constraint induces the properties of visibility, reliability, and scalability." (5.1.3)
- Its cost: repeated data per request, and less server control over consistent behavior. "The disadvantage is that it may decrease network performance by increasing the repetitive data (per-interaction overhead) sent in a series of requests" (5.1.3)
- Cache: responses are labeled cacheable or not. "Cache constraints require that the data within a response to a request be implicitly or explicitly labeled as cacheable or non-cacheable." (5.1.4)
- The cost of caching is stale data. "a cache can decrease reliability if stale data within the cache differs significantly from the data that would have been obtained had the request been sent directly to the server." (5.1.4)
- The uniform interface is REST's central feature. "The central feature that distinguishes the REST architectural style from other network-based styles is its emphasis on a uniform interface between components" (5.1.5)
- Its trade-off: a standard form is less efficient than an app-specific one. "The trade-off, though, is that a uniform interface degrades efficiency, since information is transferred in a standardized form rather than one which is specific to an application's needs." (5.1.5)
- REST is tuned for large-grain hypermedia, not every interaction. "resulting in an interface that is not optimal for other forms of architectural interaction." (5.1.5)
- The four interface constraints. "REST is defined by four interface constraints: identification of resources; manipulation of resources through representations; self-descriptive messages; and, hypermedia as the engine of application state." (5.1.5)
- Layered system: a component can't see past the layer it talks to; intermediaries can balance load and cache. "each component cannot \"see\" beyond the immediate layer with which they are interacting." (5.1.6)
- Layers cost latency, offset by shared caches. "The primary disadvantage of layered systems is that they add overhead and latency to the processing of data, reducing user-perceived performance" (5.1.6)
- Code-on-demand is optional. "However, it also reduces visibility, and thus is only an optional constraint within REST." (5.1.7)
- A resource is any information that can be named. "Any information that can be named can be a resource" (5.2.1.1)
- A resource is a mapping that can change over time, not a fixed entity. "A resource is a conceptual mapping to a set of entities, not the entity that corresponds to the mapping at any particular point in time." (5.2.1.1)
- Example: "the authors' preferred version" vs a published version are different resources. "These are two distinct resources, even if they both map to the same value at some point in time." (5.2.1.1)
- A representation is bytes plus metadata. "A representation is a sequence of bytes, plus representation metadata to describe those bytes." (5.2.1.2)
- The data format of a representation is its media type. "The data format of a representation is known as a media type" (5.2.1.2)
- Because the interface is generic, a cache can tell what's cacheable. "A cache is able to determine the cacheability of a response because the interface is generic rather than specific to each resource." (5.2.2)
- REST is not tied to one protocol, but constrains the interface. "REST does not restrict communication to a particular protocol, but it does constrain the interface between components" (5.3.2)
- Self-descriptive messages let intermediaries work. "REST enables intermediate processing by constraining messages to be self-descriptive" (5.3.1)
- The application moves from state to state by choosing among links in representations. "The model application is therefore an engine that moves from one state to the next by examining and choosing from among the alternative state transitions in the current set of representations." (5.3.3)
- The most efficient request is one that doesn't use the network. "An interesting observation is that the most efficient network request is one that doesn't use the network." (5.3.3)
- Pull, not push, because push doesn't scale to the Web. "the scale of the Web makes an unregulated push model infeasible." (5.4)
- Layers allow load balancing across machines. "Intermediaries can also be used to improve system scalability by enabling load balancing of services across multiple networks and processors." (5.1.6)
- Layers let security policy be enforced at an organization's boundary. "Such layers also allow security policies to be enforced on data crossing the organizational boundary, as is required by firewalls" (5.1.6)
- Stateless also shifts consistency to the clients. "placing the application state on the client-side reduces the server's control over consistent application behavior, since the application becomes dependent on the correct implementation of semantics across multiple client versions." (5.1.3)
- A cache hit removes an interaction altogether. "they have the potential to partially or completely eliminate some interactions" (5.1.4)
- Fielding applied REST while writing the HTTP/1.1 and URI standards. "This work included authoring the current Internet standards-track specifications of the Hypertext Transfer Protocol (HTTP/1.1) and Uniform Resource Identifiers (URI)" (5.5)
- Examples of resources, including a temporal service and a person. "a temporal service (e.g. \"today's weather in Los Angeles\"), a collection of other resources, a non-virtual object (e.g. a person), and so on." (5.2.1.1)

## Visuals worth redrawing

- Figures 5-1 to 5-8: the style built up by adding one constraint at a
  time; Figure 5-9: REST derived from other styles. Redrawn as a
  constraint ladder in the rest article.

## My notes

- Read from the author's HTML copy of the dissertation (chapter 5
  only). Chapter 6 (applying REST to HTTP and URIs) not read.
