---
id: treynor-calculus-service-availability-2017
title: The Calculus of Service Availability
author: Ben Treynor, Mike Dahlin, Vivek Rau, Betsy Beyer (Google)
url: https://static.googleusercontent.com/media/sre.google/en//static/pdf/calculus_of.pdf
kind: paper
primary: true
---

## Summary

ACM Queue article (vol. 15 no. 2, 2017; reprinted in CACM), hosted as a
PDF on sre.google. How the availability of a service's critical
dependencies caps its own, the "rule of the extra 9", why the rule
doesn't compound down a dependency tree, a worked outage budget for a
99.99% service, error budgets, and design ways to make dependencies
non-critical. Read in full (19 pages of the Queue layout).

## Key claims

- Most services should aim below 100% because users can't tell the difference. "users cannot tell the difference between a service being 100 percent available and less than “perfectly” available." (p. 2)
- Other systems in the path are far less available. "There are many other systems in the path between user and service (laptop, home WiFi, ISP, the power grid,...), and those systems collectively are far less than 100 percent available." (p. 2)
- Most Google services aim for 99.99%, some contract lower externally but keep 99.99% internally. "Some services contractually commit to a lower figure externally but set a 99.99 percent target internally." (p. 3)
- The internal target is stricter so users aren't unhappy before the contract breaks. "This more stringent target accounts for situations in which users become unhappy with service performance well before a contract violation occurs" (p. 3)
- Two sources of outages: the service and its critical dependencies. "A critical dependency is one that, if it malfunctions, causes a corresponding malfunction in the service." (Observation 1)
- Availability depends on how often and how long. "Availability is a function of the frequency and the duration of outages." (Observation 2)
- The formula. "availability is mathematically defined as MTTF/ (MTTF+MTTR), using appropriate units." (Observation 2)
- A service can't beat its critical dependencies. "A service cannot be more available than the intersection of all its critical dependencies." (Implication 1)
- Rule of the extra 9. "critical dependencies must offer one additional 9 relative to your service" (Implication 1)
- If a dependency lacks the nines, mitigate: capacity cache, failing open, graceful degradation. "you must employ mitigation to increase the effective availability of your dependency (e.g., via a capacity cache, failing open, graceful degradation in the face of errors, and so on)." (Implication 1)
- Frequency times duration caps availability: three 20-minute outages a year rule out 99.99%. "three complete outages per year that last 20 minutes each result in a total of 60 minutes of outages." (Implication 2)
- 99.99% allows no more than 53 minutes a year. "99.99 percent availability (no more than 53 minutes of downtime per year) would not be feasible." (Implication 2)
- Worked budget: 0.01% of 525,600 minutes is 53 minutes. "The total budget for outages for the year is 0.01 percent of 525,600 minutes/year, or 53 minutes" (The numbers)
- Five 99.999% dependencies take 26 minutes of it. "five independent critical dependencies, with a budget of 0.001 percent each = 0.005 percent; 0.005 percent of 525,600 minutes/year, or 26 minutes." (The numbers)
- That leaves 27 minutes for the service's own outages. "53 - 26 = 27 minutes" (The numbers)
- Expected outages weighted by scope: one full plus three single-shard at 20%. "(1 x 100 percent) + (3 x 20 percent) = 1.6" (Outage response requirements)
- So 17 minutes to detect and recover each outage. "Time available to detect and recover from an outage: 27/1.6 = 17 minutes" (Outage response requirements)
- Split: 2 minutes to alert, 5 to start investigating, 10 to mitigate. "Remaining time for an effective mitigation: 10 minutes" (Outage response requirements)
- Three levers: fewer outages, smaller scope, faster recovery. "there are three main levers to make a service more reliable." (Implication: Levers)
- Scope is reduced by sharding, geographic isolation, graceful degradation, customer isolation. "Reduce the scope of the average outage—via sharding, geographic isolation, graceful degradation, or customer isolation." (Implication: Levers)
- The extra 9 doesn't compound per level of the tree. "This inference is incorrect." (Clarifying the rule of the extra 9)
- Each unique critical dependency counts once and gets 1/N of the dependency budget. "If a service has N unique critical dependencies, then each one contributes 1/N to the dependency-induced unavailability of the top-level service, regardless of its depth in the dependency hierarchy." (Clarifying)
- Typical services have 5 to 10 critical dependencies. "Typical services often have about 5 to 10 critical dependencies" (Clarifying)
- Error budget is 1 minus the SLO. "An error budget is simply 1 minus a service’s SLO" (Error Budgets)
- Budget period is often a month. "This budget defines the acceptable level of failure for a service over some period of time (often a month)." (Error Budgets)
- Spent budget freezes changes, except security fixes and fixes for the cause. "If the error budget is spent, the service freezes changes (except for urgent security fixes and changes addressing what caused the violation in the first place)" (Error Budgets)
- Sliding windows let the budget grow back gradually. "Many services at Google use sliding windows for SLOs, so the error budget grows back gradually." (Error Budgets)
- Services above 99.99% reset quarterly because monthly downtime allowed is tiny. "For mature services with an SLO greater than 99.99 percent, a quarterly rather than monthly budget reset is appropriate" (Error Budgets)
- Golden rule: a critical component must be 10 times as reliable as the system's target. "any critical component must be 10 times as reliable as the overall system’s target, so that its contribution to system unreliability is noise." (Strategies)
- Aim to make components non-critical. "in an ideal world, the aim is to make as many components as possible noncritical." (Strategies)
- Three copies at 99.9% give a theoretical nine 9s if failures are independent. "storing three copies in three widely distributed instances provides a theoretical availability level of 1 - 0.013, or nine 9s, if instance failures are independent with zero correlation." (Redundancy and isolation; the PDF text flattens the exponent: 1 − 0.001³)
- Correlation is never zero, so the real number is far lower. "In the real world, the correlation is never zero (consider network backbone failures that affect many cells concurrently), so the actual availability will be nowhere close to nine 9s but is much higher than three 9s." (Redundancy and isolation)
- Distance isn't a good proxy for independence. "geographic separation is not always a good proxy for uncorrelated failures." (Redundancy and isolation)
- Nearby different systems can beat the same system far apart. "You may be better off using more than one system in nearby locations than the same system in distant locations." (Redundancy and isolation)
- Humans in the failover loop blow the budget. "by the time you bring a human online to trigger a failover, you’ve likely already exceeded your error budget." (Failover and fallback)
- Make calls to non-critical dependencies asynchronous so they don't become critical. "Design dependencies to be asynchronous rather than synchronous where possible so that they don’t accidentally become critical." (Asynchronicity)
- Geographic isolation costs spare capacity sharing. "isolating these geographic zones also means that Australia cannot borrow spare capacity in North America." (sidebar, Geographic isolation)
- Quarterly reset for high SLOs because the monthly downtime allowed is small. "a quarterly rather than monthly budget reset is appropriate, because the amount of allowable downtime is small." (Error Budgets)

## Visuals worth redrawing

- Figure 1 (wrong model: a tree with fan-out 10 per level) and figure 2
  (service B appears twice under service A, counted once).

## My notes

- The 53-minute figure uses a 365-day year; the SRE book's table says
  52.6 (52.56 in chapter 3). Same thing, rounded differently.
- The ACM Queue page (queue.acm.org/detail.cfm?id=3096459) blocked
  automated access; this is the same article as a PDF from sre.google.
