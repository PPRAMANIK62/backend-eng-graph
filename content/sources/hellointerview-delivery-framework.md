---
id: hellointerview-delivery-framework
title: "System Design in a Hurry: Delivery Framework"
author: Hello Interview (Evan King and Stefan Mai)
url: https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery
kind: docs
primary: false
---

## Summary

An interview-prep guide from former big-company interviewers, with a
fixed order of steps and rough timings for a system design interview:
requirements, core entities, API, optional data flow, high-level design,
deep dives. Notable for arguing against doing estimates up front.

## Key claims

- The steps and timings: Requirements (~5 minutes), Core Entities (~2 minutes), API or System Interface (~5 minutes), Data Flow (~5 minutes), High Level Design (~10-15 minutes), Deep Dives (~10 minutes). (section headings)
- Functional requirements are the core features, phrased as what users or clients should be able to do. "These are the core features of your system and should be the first thing you discuss with your interviewer." (Requirements)
- Keep the list short: pick the top 3. "it's your job to identify and prioritize the top 3." (Requirements)
- Non-functional requirements describe system qualities. "Non-functional requirements are statements about the system qualities that are important to your users." (Requirements)
- Quantify them and tie them to the part of the system that needs it. "It's important that non-functional requirements are put in the context of the system and, where possible, are quantified." (Requirements)
- The example: low latency search under 500 ms is better than just low latency, because it names the part that needs it and a target. "is much more useful as it identifies the part of the system that most needs to be low latency and provides a target." (Requirements)
- Checklist of non-functional areas includes consistency vs availability, scalability including read/write ratio, latency, durability, security, fault tolerance, compliance. "Also consider the read vs write ratio here." (Requirements, checklist item 3)
- Estimates up front are often unnecessary; do them when they change the design. "Instead, perform calculations only if they will directly influence your design." (Requirements)
- The complaint: estimates that change nothing. "Many candidates will calculate storage, DAU, and QPS, only to conclude" that the numbers are big, which tells the interviewer nothing. (Requirements)
- Example where an estimate matters: whether a top-K structure fits on one instance or must be sharded. "this will influence whether you can use a single instance of a data structure like a min-heap or if you need to shard it across multiple instances" (Requirements)
- Core entities first, full data model later. "Why not list the entire data model at this point? Because you don't know what you don't know." (Core Entities)
- Default to REST for the API. "Default to REST unless you have a specific reason not to." (API or System Interface)
- Derive the user from the auth token, not the request body. "Always authenticate requests and derive the current user from the auth token, not from user input." (API or System Interface)
- Build the high-level design endpoint by endpoint. "In most cases, you can even go one-by-one through your API endpoints and build up your design sequentially to satisfy each one." (High Level Design)
- Keep it simple first, add complexity in the deep dives. "Focus on a relatively simple design that meets the core functional requirements, and then layer on complexity to satisfy the non-functional requirements in your deep dives section." (High Level Design)
- Deep dives: meet the non-functional requirements and fix bottlenecks. "Identifying and addressing issues and bottlenecks" (Deep Dives)
- For a Twitter-like feed, the interesting deep dive is fan-out on read vs write. "We'd lead a discussion about fanout-on-read vs fanout-on-write and the use of caches." (Deep Dives)
- Adding complexity early is the common way to fail. "It's incredibly common for candidates to start layering on complexity too early, resulting in them never arriving at a complete solution." (High Level Design)
- Failing to deliver a working system is the most common failure for mid-level candidates. "This is the most common reason that mid-level candidates fail these interviews" (intro)

## Visuals worth redrawing

- The step sequence with timings; our method figure uses the same order.

## My notes

- Written for interviews, which is a narrower goal than real design.
  The page's HTML names Evan King and Stefan Mai as authors.
