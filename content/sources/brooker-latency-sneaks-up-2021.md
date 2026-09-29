---
id: brooker-latency-sneaks-up-2021
title: Latency Sneaks Up On You
author: Marc Brooker
url: https://brooker.co.za/blog/2021/08/05/utilization.html
kind: blog
primary: false
---

## Summary

A 2021 post on why efficiency wins seem to disappear. In a single-server
queue, the number of jobs in the system grows as ρ/(1−ρ), so latency
rises slowly at low utilization and very fast near 1. Speeding up the
server lowers ρ and cuts tail latency a lot; then traffic grows or
servers get removed, ρ climbs back, and the latency comes back with it.

## Key claims

- Utilization is arrival rate over service rate, ρ = λ/μ, and the server is idle the rest of the time. "Another way to think of ⍴ is that the server is idle (no work to do, empty queue) 1-⍴ of the time." (main text)
- Above 1 the queue never stops growing. "Clearly, if ⍴>1 for a long time then the queue grows without bound, because more stuff is arriving than leaving." (main text)
- Why busier means slower. "the closer ⍴ gets to 1, the more likely it is that an incoming item of work will find a busy server, and so will be queued." (main text)
- Mean jobs in the system is E[N] = ρ/(1−ρ). "at ⍴=0.5 (about half utilized), E[N] is 1. At ⍴=0.99, it’s 99." (main text)
- Waiting in a queue is a common cause of outlier latency. "Waiting in the queue3 for service is a common cause of outlier latency." (main text; the 3 is a footnote marker)
- Why efficiency gains fade: growth or fewer servers push ρ back up. "That causes ⍴ to pop back up, and latency to return to where it was." (main text)
- What high percentiles are good for. "high-percentile latency is a bad way to measure efficiency, but a good (leading) indicator of pending overload." (main text)
- The model is M/M/1. "The system I’m considering is M/M/1, with a single server, unbounded queue, Poisson arrival process, and exponentially distributed service time." (footnote 1)
- One client isn't Poisson; many independent ones together are close. "single clients don’t tend to be Poisson processes, but the sum of very large numbers of independent clients do." (footnote 2)
- Queues hide: threads waiting on a lock, tasks waiting on I/O. "Implicit queues are everywhere." (footnote 3)
- Other systems differ. "Systems with backpressure will behave differently." (main text)
- He defends the mean for this job. "If you must use latency to measure efficiency, use mean (avg) latency." (main text)
- Against the "never use averages" advice. "Yes, those people on the internet that tell you never to measure average latency are wrong." (footnote 4)

## Visuals worth redrawing

- The E[N] against ρ curve, flat then shooting up near 1. Redraw from
  the formula.

## My notes

- The formula on the page is printed as "⍴/(1-p)", a typo for ρ/(1−ρ).
