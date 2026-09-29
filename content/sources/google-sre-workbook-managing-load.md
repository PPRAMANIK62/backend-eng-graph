---
id: google-sre-workbook-managing-load
title: "The Site Reliability Workbook, chapter 11: Managing Load"
author: Cooper Bethea, Gráinne Sheerin, Jennifer Mace and Ruth King, with Gary Luo and Gary O'Connor, Google
url: https://sre.google/workbook/managing-load/
kind: book
primary: true
---

## Summary

The SRE Workbook (2018) chapter on load balancing, autoscaling and load
shedding as one system. Two case studies matter here: the Pokémon GO
launch on Google Cloud Load Balancing, a cascading failure driven by
synchronized client retries (a thundering herd), and "When Load Shedding
Attacks", where load shedding fooled a utilization-aware load balancer.

## Key claims

- Pokémon GO launch traffic was nearly 50x the estimate; load tests went to 5x. "The actual launch requests per second (RPS) rate was nearly 50x that estimate" (Case Study 1)
- True demand was 200% higher than previously observed. "Both Google and Niantic discovered that the true client demand for Pokémon GO traffic was 200% higher than previously observed." (Migrating to GCLB)
- Refused connections didn't show up in monitoring. "Any connection refused in this way wasn’t surfaced in the monitoring for inbound requests." (Migrating to GCLB)
- It became a classic cascading failure. "This traffic surge caused a classic cascading failure scenario." (Migrating to GCLB)
- Backends became slow rather than refusing, and the load balancer retried. "The overload caused Niantic’s backends to become extremely slow (rather than refuse requests), manifesting as requests timing out to the load balancing layer." (Migrating to GCLB)
- The load balancer's own capacity fell by half. "This induced a severe performance regression in GFE such that GCLB’s worldwide capacity was effectively reduced by 50%." (Migrating to GCLB)
- The app retried once immediately, then at a constant interval. "At the time, the app’s retry strategy was a single immediate retry, followed by constant backoff." (Migrating to GCLB)
- Bursts of quick errors synchronized the clients' retries: a thundering herd. "These error responses served to effectively synchronize client retries, producing a “thundering herd” problem, in which many client requests were issued at essentially the same time." (Migrating to GCLB)
- The spikes reached 20x the previous global peak. "these synchronized request spikes ramped up enormously to 20× the previous global RPS peak." (Migrating to GCLB)
- The fix during the incident included limiting the rate the load balancers accepted. "Traffic SRE implemented administrative overrides to limit the rate of traffic the load balancers would accept on behalf of Pokémon GO." (Resolving the issue)
- Afterwards clients got jitter and truncated exponential backoff. "Niantic introduced jitter and truncated exponential backoff3 to their clients, which curbed the massive synchronized retry spikes experienced during cascading failure." (Future-proofing; the 3 is a footnote marker)
- Measure load as close to the client as possible. "both companies realized they should measure load as close to the client as possible." (Future-proofing)
- Load balancing, shedding and autoscaling interact. "Load balancing, load shedding, and autoscaling are all systems designed for the same goal: to equalize and stabilize the system load." (Autoscaling section, before Case Study 2)
- Dressy: servers shed above a CPU threshold, keeping CPU flat. "Each server began rejecting 10% of requests it received, then 20% of requests, then 50%. During this time frame, CPU usage remained constant." (What was happening?)
- The balancer read errors as cheap requests and sent more. "As far as the load balancer system was concerned, each successive dropped request was a reduction in the per-request CPU cost." (What was happening?)
- The two systems weren't talking. "the load balancer didn’t know that the “efficient” requests were errors because the load shedding and load balancing systems weren’t communicating." (What went wrong?)
- Fix: count an error as more than 100% utilization. "Let’s say each “error” request counts as 120% CPU utilization (any number over 100 will work)." (Lessons learned)
- Autoscale before shedding kicks in. "It’s a good idea to set your thresholds such that your system autoscales before load shedding kicks in." (Load shedding precautions)
- Set deadlines when using autoscaling and shedding together. "When using both autoscaling and load shedding, it’s important that you set deadlines on your RPC requests." (Managing load with RPC)
- Nothing saves you when every mechanism fails in sync. "Time and time again, we’ve seen that no amount of load shedding, autoscaling, or throttling will save our services when they all fail in sync." (Conclusion)
- Autoscaling a service whose dependency is failing makes it worse: requests get stuck and more servers add load. "This failure causes all requests to get stuck on your servers and never finish, consuming resources all the while." (Autoscaling)
- Unhealthy or warming-up instances still counted in the average can stop scaling. "Autoscaling runs into problems when machines are not serving (known as unhealthy instances) but are still counted toward the utilization average. In this scenario, autoscaling simply won’t occur." (Handling Unhealthy Machines)
- New capacity takes time. "Creating new instances is never instant." (Handling Unhealthy Machines)
- Scale up eagerly, scale down cautiously. "By design, most autoscaler implementations are intentionally more sensitive to jumps in traffic than to drops in traffic." (Configuring Conservatively)
- Keep far from the bottleneck and keep spare capacity, because the autoscaler needs time to react. "Autoscaler also needs adequate time to react, particularly when new instances cannot turn up and serve instantly." (Configuring Conservatively)
- A bug that burns CPU makes a CPU-based autoscaler grow until quota runs out. "Autoscaler reacts by upsizing this job again and again until all available quota is wasted." (Setting Constraints)
- Set minimum and maximum bounds. "Set a minimum and maximum bound for scaling, making sure that you have enough quota to scale to the set limits." (Setting Constraints)
- Keep a kill switch for the autoscaler. "It’s a good idea to have a kill switch in case something goes wrong with your autoscaling." (Including Kill Switches and Manual Overrides)
- Scaling up pushes more load onto backends such as databases. "Backend services, such as databases, need to absorb any additional load your servers might create." (Avoiding Overloading Backends)
- Horizontal scaling doesn't help a stateful system whose sessions stick to one server. "If these pathways are overburdened, adding more instances (i.e., horizontal scaling) won’t help." (Working with Stateful Systems)
- What set off the synchronized errors. "As the outage continued, the service sometimes returned a large number of quick errors—for example, when a shared backend restarted." (Migrating to GCLB)
- The load-balancer limit let the game recover. "This strategy contained client demand enough to allow Niantic to reestablish normal operation and commence scaling upward." (Resolving the issue)
- The load balancer retried timed-out requests, adding load. "Under this circumstance, the load balancer retried GET requests, adding to the system load." (Migrating to GCLB)
- Scale on the load balancer's capacity metric to discount unhealthy instances. "Autoscale using a capacity metric as observed by the load balancer. This will automatically discount unhealthy instances from the average." (Handling Unhealthy Machines)
- Stateful systems route a session to one server. "A stateful system sends all requests in a user session consistently to the same backend server." (Working with Stateful Systems)

## Visuals worth redrawing

- Figure 11-6: traffic spikes from synchronized client retries. Redraw as
  a schematic of spikes vs a smooth jittered line, without the numbers.
- Figure 11-9: regional traffic in the Dressy case.

## My notes

- Dressy is a fictional company; the numbers in it are an illustration.
