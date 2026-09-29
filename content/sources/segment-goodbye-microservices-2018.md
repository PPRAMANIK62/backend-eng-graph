---
id: segment-goodbye-microservices-2018
title: "Goodbye Microservices: From 100s of problem children to 1 superstar"
author: Alexandra Noonan, Segment
url: https://segment.com/blog/goodbye-microservices/
kind: blog
primary: true
---

## Summary

Segment's account (2018) of splitting its event-delivery pipeline into
one service and queue per destination, then merging more than 140 of
those services back into one. The split fixed head-of-line blocking; the
cost came from diverging shared libraries, per-service scaling and
operations. The merge kept the queue isolation in a new component.

## Key claims

- The original single queue caused head-of-line blocking when one destination slowed. "if one destination slowed or went down, retries would flood the queue, resulting in delays across all our destinations." (Why Microservices worked)
- The fix was one service and one queue per destination. "the team created a separate service and queue for each destination." (Why Microservices worked)
- Shared libraries diverged because updating them meant testing and deploying dozens of services. "Eventually, all of them were using different versions of these shared libraries." (The Case for Individual Repos)
- Each service had its own load pattern, so autoscaling was hard to tune. "each service had a distinct blend of required CPU and memory resources, which made tuning the auto-scaling configuration more art than science." (Scaling Microservices and Repos)
- Operational overhead grew with every destination. "With our microservice architecture, our operational overhead increased linearly with each added destination." (Scaling Microservices and Repos)
- Three full-time engineers spent most of their time keeping it alive. "with 3 full-time engineers spending most of their time just keeping the system alive." (intro)
- They consolidated more than 140 services into one. "The first item on the list was to consolidate the now over 140 services into a single service." (Ditching Microservices and Queues)
- One version per dependency, 120 dependencies. "For each of the 120 unique dependencies, we committed to having one version for all our destinations." (Moving to a Monorepo)
- The shared worker pool absorbs spikes. "The large worker pool can absorb spikes in load, so we no longer get paged for destinations that process small amounts of load." (Why a Monolith works)
- Productivity measure they give: 32 shared-library improvements under microservices, 46 in the year after. "When our microservice architecture was still in place, we made 32 improvements to our shared libraries. One year later,  we’ve made 46 improvements." (Why a Monolith works)
- Trade-off: fault isolation is harder. "if a bug is introduced in one destination that causes the service to crash, the service will crash for all destinations." (Trade Offs, item 1)
- Trade-off: in-memory caches spread thin across 3000+ processes. "Now that cache is spread thinly across 3000+ processes so it’s much less likely to be hit." (Trade Offs, item 2)
- The queue isolation moved into Centrifuge. "Centrifuge would replace all our individual queues and be responsible for sending events to the single monolithic service." (Ditching Microservices and Queues)

## Visuals worth redrawing

- The before/after pipeline figures (single queue; router with a queue
  per destination; router, Centrifuge, one service).

## My notes

- The page HTML names Alexandra Noonan as the author. The "32 vs 46" comparison has no control for
  team size or other changes; present it as their own measure.
