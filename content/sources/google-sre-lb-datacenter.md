---
id: google-sre-lb-datacenter
title: "Load Balancing in the Datacenter (Site Reliability Engineering, ch. 20)"
author: Alejandro Forero Cuervo, edited by Sarah Chavis
url: https://sre.google/sre-book/load-balancing-datacenter/
kind: book
primary: true
---

## Summary

How Google's RPC clients pick a backend for each request inside one
datacenter (2017). Covers why uneven load wastes reserved capacity, how
clients spot bad backends (active-request limits, the lame duck state),
subsetting so each client talks to only some backends, and three
policies: round robin, least-loaded round robin and weighted round robin.

## Key claims

- Uneven load wastes capacity, because you can only add traffic until the busiest task is full. "We can only send traffic to a datacenter until the point at which the most loaded task reaches its capacity limit" (The Ideal Case)
- Example of the waste. "you may be reserving 1,000 CPUs for your service in a given datacenter, but be unable to actually use more than, say, 700 CPUs." (The Ideal Case)
- Services typically have 100 to 1,000 backend processes. "In the typical case, services are composed of between 100 and 1,000 processes." (intro)
- Simple flow control: a client stops sending to a backend with too many active requests. "When this active-request count reaches a configured limit, the client treats the backend as unhealthy and no longer sends it requests." (A Simple Approach to Unhealthy Tasks: Flow Control)
- That limit can backfire. "We’ve seen cases in which this default limit has backfired, causing all backend tasks to become unreachable" (Flow Control)
- Three states from the client's view: healthy, refusing connections, lame duck. Lame duck means the task still serves but asks for no new requests. "The backend task is listening on its port and can serve, but is explicitly asking clients to stop sending requests." (Lame Duck State)
- Shutdown steps: SIGTERM, enter lame duck, finish in-flight requests, exit after an interval. "a good rule of thumb is between 10s and 150s depending on client complexity." (Lame Duck State, step 5)
- Clients keep long-lived connection pools; per-request connections cost too much. "An alternative model would be to establish and tear down a connection for each request, but this model has significant resource and latency costs." (Limiting the Connections Pool with Subsetting)
- Subsetting limits how many backends each client connects to, typically 20 to 100. "We typically use a subset size of 20 to 100 backend tasks" (Picking the Right Subset)
- Random subsetting spreads badly: 300 clients, 300 backends, subset of 30%, least loaded backend 63% of average, most loaded 121%; at 10%, 50% and 150%. "the least loaded backend has just 63% of the average load (57 connections, where the average is 90 connections) and the most loaded has 121% (109 connections)." (A Subset Selection Algorithm: Random Subsetting)
- Deterministic subsetting gives each backend the same number of clients in their example. "each backend receives exactly the same number of connections." (Deterministic Subsetting)
- How it works: clients are grouped into rounds, each round shuffles the backend list with the same seed and hands each client one slice. "Within each round, each backend is assigned to exactly one client (except possibly the last round, which may not contain enough clients, so some backends may not be assigned)." (A Subset Selection Algorithm: Deterministic Subsetting)
- Balancing decisions are made by many clients with partial, stale information. "clients need to decide, in real time (and with only partial and/or stale backend state information), which backend should be used for each request." (Load Balancing Policies)
- Round robin can leave a 2x spread in CPU. "we’ve found that Round Robin can result in a spread of up to 2x in CPU consumption from the least to the most loaded task." (Simple Round Robin)
- Reasons: small subsets, varying query costs, machine diversity, unpredictable factors. (Simple Round Robin, list)
- Request costs vary hugely. "the most expensive requests consume 1000x (or more) CPU than the cheapest requests." (Varying query costs)
- Interfaces often allow requests 100 to 10,000 times more expensive than the cheapest. "services are often defined to allow the most expensive requests to consume 100, 1,000, or even 10,000 times more resources than the cheapest requests." (Varying query costs)
- One fix is to cap work per request, such as with pagination, though changing an interface is hard. "It can become necessary to adjust the service interfaces to functionally cap the amount of work done per request." (Varying query costs)
- One Java backend: about 15 ms CPU on average, up to 10 s for some queries. "queries consume around 15 ms of CPU on average but some queries can easily require up to 10 seconds." (Varying query costs)
- Noisy neighbours cost up to 20%. "We’ve seen differences in performance of this nature of up to 20%." (Antagonistic neighbors)
- Restarted tasks need more resources for a while; Google keeps them in lame duck to warm up. "When a task gets restarted, it often requires significantly more resources for a few minutes." (Task restarts)
- Machines in one datacenter differ in CPU speed. "A given datacenter may have machines with CPUs of varying performance" (Machine diversity)
- Lame duck avoids failing in-flight requests during shutdown. "it simplifies clean shutdown, which avoids serving errors to all the unlucky requests that happened to be active on backend tasks that are shutting down." (Lame Duck State)
- Each connection costs memory and CPU for health checks at both ends. "Every connection requires some memory and CPU (due to periodic health checking) at both ends." (Limiting the Connections Pool with Subsetting)
- Least-loaded round robin: round robin among backends with the fewest active requests. "use Round Robin among the set of tasks with a minimal number of active requests." (Least-Loaded Round Robin)
- A failing backend that errors fast attracts traffic, which Google calls sinkholing; fix by counting recent errors as active requests. "We say that the unhealthy task is now sinkholing traffic." (Least-Loaded Round Robin)
- Active requests are a poor proxy for capacity, and a client only sees its own requests. "each client task has only a very limited view into the state of its backend tasks: the view of its own requests." (Least-Loaded Round Robin)
- In practice least-loaded was about as bad as round robin. "large services using Least-Loaded Round Robin will see their most loaded backend task using twice as much CPU as the least loaded, performing about as poorly as Round Robin." (Least-Loaded Round Robin)
- Weighted round robin: backends report query rate, error rate and utilization in every response, clients turn that into per-backend weights. "backends include the current observed rates of queries and errors per second, in addition to the utilization (typically, CPU usage)." (Weighted Round Robin)
- Each client keeps a "capability" score per backend; load reports ride on every response, health checks included, and failures are penalised. "In each response (including responses to health checks), backends include the current observed rates of queries and errors per second" (Weighted Round Robin)
- Failed requests count against a backend. "failed requests result in a penalty that affects future decisions." (Weighted Round Robin)
- The spread shrank a lot after the switch from least-loaded. "The spread from the least to the most loaded tasks decreased drastically." (Weighted Round Robin)
- It worked. "In practice, Weighted Round Robin has worked very well and significantly reduced the difference between the most and the least utilized tasks." (Weighted Round Robin)

## Visuals worth redrawing

- Figure 20-2: CPU used and wasted per task in two scenarios (the
  wasted area above each bar up to the busiest task).
- Figures 20-3 to 20-5: connections per backend under random vs
  deterministic subsetting.

## My notes

- Client-side balancing, not a proxy: every client runs the policy.
  The same algorithms run in Google's GFE reverse proxy.
