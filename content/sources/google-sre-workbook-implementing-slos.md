---
id: google-sre-workbook-implementing-slos
title: Implementing SLOs (The Site Reliability Workbook, chapter 2)
author: Steven Thurgood, David Ferguson, with Alex Hidalgo and Betsy Beyer (Google)
url: https://sre.google/workbook/implementing-slos/
kind: book
primary: true
---

## Summary

Chapter 2 of Google's SRE Workbook (2018), free online. A step-by-step
recipe for SLOs: SLIs as good events over valid events, SLI
specification vs implementation, which SLIs fit which kind of system,
a worked example on a mobile game's API, time windows, getting
stakeholders to agree, the error budget policy, and advanced topics
(user journeys, bucketing, dependencies).

## Key claims

- An SLO is a threshold of user happiness. "Above this threshold, almost all users should be happy with your service" (Reliability Targets and Error Budgets)
- 100% is the wrong target; change is the top source of outages. "The number one source of outages is change" (Reliability Targets and Error Budgets)
- A 100% SLO leaves time only for reacting. "An SLO of 100% means you only have time to be reactive." (Reliability Targets and Error Budgets)
- The SLO needs an owner who can trade features against reliability, usually the product owner. "it needs to be owned by someone in the organization who is empowered to make tradeoffs between feature velocity and reliability." (Reliability Targets and Error Budgets)
- Recommended SLI form: good events over total events. "we generally recommend treating the SLI as the ratio of two numbers: the number of good events divided by the total number of events." (What to Measure: Using SLIs)
- A latency SLI in that form: calls that completed under a threshold over all calls. "Number of gRPC calls that completed successfully in < 100 ms / total gRPC requests" (What to Measure: Using SLIs)
- The SLI runs from 0% to 100%. "The SLI ranges from 0% to 100%, where 0% means nothing works, and 100% means nothing is broken." (What to Measure: Using SLIs)
- Error budget is 100% minus the SLO; 99.9% on 3 million requests in four weeks is 3,000 errors. "if you have a 99.9% success ratio SLO, then a service that receives 3 million requests over a four-week period had a budget of 3,000 (0.1%) errors over that period." (What to Measure: Using SLIs)
- One outage of 1,500 errors costs half of that budget. "If a single outage is responsible for 1,500 errors, that error costs 50% of the error budget." (What to Measure: Using SLIs)
- SLI specification is what matters to users; implementation is how you measure it. "The assessment of service outcome that you think matters to users, independent of how it is measured." (SLI specification)
- Server logs miss requests that never reach the backend. "This measurement will miss requests that fail to reach the backend." (SLI implementation)
- Each implementation trades quality, coverage and cost. "each with its own set of pros and cons in terms of quality (how accurately they capture the experience of a customer), coverage (how well they capture the experience of all customers), and cost." (SLI implementation)
- Current performance is an OK start if you iterate. "your current performance can be a good place to start if you don’t have any other information, and if you have a good process for iterating in place" (What to Measure: Using SLIs)
- Keep to five or fewer SLI types. "We recommend choosing a small number (five or fewer) of SLI types that represent the most critical functionality to your customers." (A Worked Example)
- Several thresholds for latency: 90% under 100 ms and 99% under 400 ms. "90% of requests are faster than 100 ms, and 99% of requests are faster than 400 ms." (A Worked Example)
- Table 2-1: request-driven SLIs are availability, latency, quality; pipelines freshness, correctness, coverage; storage durability. "The proportion of requests that were faster than some threshold." (Table 2-1, Latency)
- In the example, 5XX counts against the SLO; everything else is success. "5XX responses count against SLO, while all other requests are considered successful." (API and HTTP server availability and latency)
- SLI sources: server logs, load balancer, black-box probes, client instrumentation. "Load balancer monitoring" (API and HTTP server availability and latency)
- Worked numbers: 3,663,253 requests, 97.123% success, p90 432 ms, p99 891 ms over four weeks. "Total successful requests: 3,557,865 (97.123%)" (Using the SLIs to Calculate Starter SLOs)
- Proposed SLOs rounded down: 97% availability, 90% < 450 ms, 99% < 900 ms. (Table 2-3)
- Budgets over four weeks: 109,897 failures at 97%, 366,325 slow at 90% < 450 ms, 36,632 at 99% < 900 ms. (Table 2-4)
- Rolling windows match what users feel; calendar windows match planning. "Rolling windows are more closely aligned with user experience" (Choosing an Appropriate Time Window)
- Four-week rolling window recommended. "We have found a four-week rolling window to be a good general-purpose interval." (Choosing an Appropriate Time Window)
- Use whole weeks so every window has the same number of weekends. "We recommend defining this period as an integral number of weeks so it always contains the same number of weekends." (Choosing an Appropriate Time Window)
- Three parties must agree: product managers, developers, and the team running it. "The product managers have to agree that this threshold is good enough for users" (Getting Stakeholder Agreement)
- An error budget policy says what happens when the budget runs out. "you need a policy outlining what to do when your service runs out of budget." (Establishing an Error Budget Policy)
- Without a policy, SLO compliance is just another KPI. "SLO compliance will simply be another KPI (key performance indicator) or reporting metric, rather than a decision-making tool." (Getting Started)
- Incidents can be ranked by the share of budget they burned: a 4-hour bad release cost 14,066 errors, 13% of the budget. "this single event used 13% of our error budget." (Decision Making Using SLOs and Error Budgets)
- A 20-hour database restore cost 72,000 errors, 65%. "this outage caused us 72,000 errors, or 65% of our error budget." (Decision Making Using SLOs and Error Budgets)
- One server failure in five years vs two or three bad releases a year: bad pushes cost twice as much budget. "We can estimate that, on average, bad pushes cost twice as much error budget as database failures." (Decision Making Using SLOs and Error Budgets)
- Different SLOs per customer tier: premium 99.99%, free 99.9%. (Table 2-6)
- Counting slow requests directly beats estimating them from histogram buckets. "Generally speaking, it is better to count the slow requests than to approximate them with a histogram." (Load balancer metrics)
- Per-customer SLOs are noisy for small customers. "customers who send a very low number of requests will have either 100% availability (because they were lucky enough to experience no failures) or very low availability (because the one failure they experienced was a significant percentage of their requests)." (Grading Interaction Importance)
- Critical user journeys (search, add to cart, buy) are the thing to aim SLOs at, even though they're harder to measure. "A critical user journey is a sequence of tasks that is a core part of a given user’s experience and an essential aspect of the service." (Modeling User Journeys)
- The running team must agree the SLO is defensible without burnout. "The team responsible for the production environment who are tasked with defending this SLO have agreed that it is defensible without Herculean effort, excessive toil, and burnout" (Getting Stakeholder Agreement)
- Alert on threats to the budget. "To defend your SLO you will need to set up monitoring and alerting (see Alerting on SLOs) so that engineers receive timely notifications of threats to the error budget before those threats become deficits." (Getting Stakeholder Agreement)
- Load balancer metrics are closer to the user than app logs. "provide SLIs that are closer to the user’s experience than those from the application server’s logs." (API and HTTP server availability and latency)
- Probers catch requests that can't reach the network but may miss partial problems. "This measurement will catch errors when requests cannot reach our network, but may miss issues that affect only a subset of users." (SLI implementation)
- Fixing a weak SLI: move it closer to the user, or widen coverage. "either move the measurement closer to the user to improve the quality of the metric, or improve coverage so you capture a higher percentage of user interactions." (Change your SLI implementation)
- Journeys and bucketing are advanced topics, after a mature SLO culture. "Once you have a healthy and mature SLO and error budget culture, you can continue to improve and refine how you measure and discuss the reliability of your services." (Advanced Topics)
- A critical dependency should be at least as reliable as the action that depends on it. "its reliability guarantee should be at least as high as the reliability guarantee of the dependent action." (Modeling Dependencies)
- Two zones at 99.9% don't give 99.9999%, because the copies share failure domains. "The two instances of your app will have common dependencies, common failure domains, shared fate, and global control planes—all of which can cause an outage in both systems" (Modeling Dependencies)
- Two schools on whether a dependency's outage should freeze your releases; the freeze makes users happier. "The second approach will make your users happier." (Modeling Dependencies)
- One consistent SLI form lets all tooling expect the same inputs. "you can write alerting logic, SLO analysis tools, error budget calculation, and reports to expect the same inputs: numerator, denominator, and threshold." (What to Measure: Using SLIs)
- Client instrumentation captures the user experience best but means changing code and building a telemetry service. "we now need to modify the code to capture this information and build the infrastructure to record it" (SLI implementation)
- A rolling window doesn't forget an outage at the end of a month. "if you have a large outage on the final day of a month, your user doesn’t suddenly forget about it on the first day of the following month." (Choosing an Appropriate Time Window)
- Whole weeks matter because weekend traffic can differ. "If weekend traffic differs significantly from weekday traffic, your SLIs may vary for uninteresting reasons." (Choosing an Appropriate Time Window)

## Visuals worth redrawing

- Figure 2-4: an error budget dashboard for one quarter, showing one
  event that took about 15% of the budget over two days.

## My notes

- The "SLI = good / total" style is what makes error budgets and
  burn-rate alerts easy; chapter 5 of the workbook builds on it.
