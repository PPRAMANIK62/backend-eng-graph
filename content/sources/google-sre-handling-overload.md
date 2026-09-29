---
id: google-sre-handling-overload
title: "Site Reliability Engineering, chapter 21: Handling Overload"
author: Alejandro Forero Cuervo, Google (Beyer, Jones, Petoff, Murphy, eds.)
url: https://sre.google/sre-book/handling-overload/
kind: book
primary: true
---

## Summary

The SRE book (2016) chapter on running near capacity. Read for its
"Deciding to Retry" section: Google's three limits on retries (per
request, per client, and a server-side "don't retry" signal) and the
rule to retry only at the layer right above the one rejecting.

## Key claims

- A per-request limit of three attempts. "First, we implement a per-request retry budget of up to three attempts." (Deciding to Retry)
- Why: after three overloaded tasks, the whole datacenter is likely overloaded. "it's relatively unlikely that attempting it again will help because the whole datacenter is likely overloaded." (Deciding to Retry)
- A per-client retry budget: retry only while retries are under 10% of requests. "A request will only be retried as long as this ratio is below 10%." (Deciding to Retry; the page breaks the line after "A request")
- Worst case with only the three-attempt limit is almost 3x the load; with the 10% budget, about 1.1x. "layering on the per-client retry budget (a 10% retry ratio) reduces the growth to just 1.1x in the general case—a significant improvement." (Deciding to Retry)
- Clients send an attempt counter; backends that see many retries answer "overloaded; don't retry". "they return an "overloaded; don't retry" error response instead of the standard "task overloaded" error that triggers retries." (Deciding to Retry)
- Retry only at the layer directly above the one that rejected. "requests should only be retried at the layer immediately above the layer that is rejecting them." (Deciding to Retry)
- Otherwise retries explode combinatorially. "If multiple layers retried, we'd have a combinatorial explosion." (Deciding to Retry)
- When only a few tasks are overloaded, retrying immediately on another task is the preferred response. "It's much more typical that only a small portion of tasks become overloaded, in which case the preferred response is to retry the request immediately." (Handling Overload Errors)
- Retries rely on probably landing on a different task. "we just rely on the likely probability that the retry will land on a different backend task simply by virtue of the number of participating backends in the subset." (Handling Overload Errors)
- (For capacity-planning.) Requests per second is a poor unit of capacity, because request cost varies and drifts. "modeling capacity as "queries per second" or using static features of the requests that are believed to be a proxy for the resources they consume (e.g., "how many keys are the requests reading") often makes for a poor metric." (The Pitfalls of "Queries per Second")
- Count resources instead. "A better solution is to measure capacity directly in available resources." (The Pitfalls of "Queries per Second")
- CPU usually works as the provisioning signal. "we've found that simply using CPU consumption as the signal for provisioning works well" (The Pitfalls of "Queries per Second")
- One reason: with garbage collection, memory pressure shows up as CPU. "In platforms with garbage collection, memory pressure naturally translates into increased CPU consumption." (The Pitfalls of "Queries per Second")
- Why request cost varies: the client's code, or even the time of day. "A query's cost can vary based on arbitrary factors such as the code in the client that issues them (for services that have many different clients) or even the time of the day" (The Pitfalls of "Queries per Second")

- (For retry-budgets and circuit-breakers.) Rejecting a request still costs the backend something, and enough rejections can overload it. "In such cases, the backend can become overloaded even though the vast majority of its CPU is spent just rejecting requests!" (Client-Side Throttling)
- Client-side throttling: a client that sees many rejections caps its own traffic, and extra requests fail locally. "Requests above the cap fail locally without even reaching the network." (Client-Side Throttling)
- Adaptive throttling counts requests and accepts over the last two minutes; above K times accepts, the client rejects new requests with a rising probability. "Clients can continue to issue requests to the backend until requests is K times as large as accepts." (Client-Side Throttling)
- Google generally uses K = 2. "We generally prefer the 2x multiplier." (Client-Side Throttling)
- It works on local information only, but badly for clients that send rarely. "One large advantage of this approach is that the decision is made by the client task based entirely on local information and using a relatively simple implementation: there are no additional dependencies or latency penalties." (Client-Side Throttling)
- Worst case with only the three-attempt cap is "somewhere just below 3X". "Due to the number of retries that will occur, the number of requests will grow significantly, to somewhere just below 3X." (Deciding to Retry)
- A layer that can't get an answer returns "don't retry" or a degraded response. "or a degraded response (assuming that it can produce some moderately useful response even when its request to the DB Frontend failed)." (Deciding to Retry)
- (For load-shedding and graceful-degradation.) Degraded responses: less accurate or less data but cheaper. "One option for handling overload is to serve degraded responses: responses that are not as accurate as or that contain less data than normal responses, but that are easier to compute." (Handling Overload)
- Examples: search a small part of the corpus, use a stale local copy. "Rely on a local copy of results that may not be fully up to date but that will be cheaper to use than going against the canonical storage." (Handling Overload)
- Per-customer limits so only misbehaving customers get errors. "When global overload does occur, it's vital that the service only delivers error responses to misbehaving customers, while other customers remain unaffected." (Per-Customer Limits)
- The rejection probability is max(0, (requests - K × accepts) / (requests + 1)), shown as an image. (Client-Side Throttling, "Client request rejection probability")
- In big overloads backends reject about one request per request processed. "Even in large overload situations, backends end up rejecting one request for each request they actually process." (Client-Side Throttling)
- Four criticality values: CRITICAL_PLUS, CRITICAL, SHEDDABLE_PLUS, SHEDDABLE. "A request made to a backend is associated with one of four possible criticality values, depending on how critical we consider that request" (Criticality)
- Capacity is provisioned for CRITICAL and CRITICAL_PLUS. "Services are expected to provision enough capacity for all expected CRITICAL and CRITICAL_PLUS traffic." (Criticality)
- An overloaded task rejects lower criticalities sooner. "When a task is itself overloaded, it will reject requests of lower criticalities sooner." (Criticality)
- Criticality is separate from latency needs: typeahead suggestions are sheddable but latency-sensitive. "The criticality of a request is orthogonal to its latency requirements" (Criticality)
- Criticality propagates to outgoing calls by default. "request B and request C will use the same criticality as request A by default." (Criticality)
- Set it close to the user, in the HTTP frontends. "Our practice is thus to set the criticality as close as possible to the browsers or mobile clients" (Criticality)
- Utilization thresholds, higher for higher criticalities. "As utilization approaches configured thresholds, we start rejecting requests based on their criticality (higher thresholds for higher criticalities)." (Utilization Signals)
- Executor load average: smoothed count of running or runnable threads, rejecting once above the processors available. "We smooth this value with exponential decay and begin rejecting requests as the number of active threads grows beyond the number of processors available to the task." (Utilization Signals)
- Smoothing swallows short fan-out spikes. "will cause the load to spike very briefly, but the smoothing will mostly swallow that spike." (Utilization Signals)
- A task should keep serving its provisioned rate however much extra arrives, up to 2x or 10x. "a backend task provisioned to serve a certain traffic rate should continue to serve traffic at that rate without any significant impact on latency, regardless of how much excess traffic is thrown at the task." (Conclusions)
- Don't stop accepting everything when overloaded. "It's a common mistake to assume that an overloaded backend should turn down and stop accepting all traffic." (Conclusions)
- A batch proxy acts as a fuse for big batch jobs. "Effectively, the batch proxy acts like a fuse." (Load from Connections)
- Sheddable is the default for batch jobs. "This is the default for batch jobs, which can retry requests minutes or even hours later." (Criticality, SHEDDABLE)

## Visuals worth redrawing

- Figure 21-1: histograms of attempt counts seen by a backend. Not
  needed for phase 5.

## My notes

- Phase 13's retry-budgets node will lean on this more than phase 5.
