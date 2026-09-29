---
id: google-sre-workbook-canarying
title: "The Site Reliability Workbook, chapter 16: Canarying Releases"
author: Alec Warner and Štěpán Davidovič, with Alex Hidalgo, Betsy Beyer, Kyle Smith and Matt Duftler, Google
url: https://sre.google/workbook/canarying-releases/
kind: book
primary: true
---

## Summary

The SRE Workbook (2018) chapter on canarying: release engineering
principles, what a canary is, how big and how long, which metrics to
compare, why before/after comparison is risky, and how blue/green,
synthetic load and traffic teeing relate.

## Key claims

- Definition: a partial, time-limited deployment plus an evaluation. "We define canarying as a partial and time-limited deployment of a change in a service and its evaluation." (intro)
- Canary vs control. "The part of the service that receives the change is “the canary,” and the remainder of the service is “the control.”" (intro)
- Most incidents come from pushes. "In Google’s experience, a majority of incidents are triggered by binary or configuration pushes" (Balancing Release Velocity and Reliability)
- Flags separate feature launches from binary releases. "Feature flag or experiment frameworks like Gertrude, Feature, and PlanOut allow you to separate feature launches from binary releases." (Separating Components)
- Tests can't catch everything; some defects reach production. "Some defects will reach production. If a release deploys instantly everywhere, any defects will deploy in the same way." (What Is Canarying?)
- Three requirements: deploy to a subset, evaluate, feed the result into the release. "An evaluation process to evaluate if the canaried change is “good” or “bad.”" (Requirements of a Canary Process)
- Roll back if the canary's error rate is far from the control's. "If the error rate of the canary metric is too far from the control error rate, this signals the canary deployment is “bad.”" (A Roll Forward Deployment Versus a Simple Canary Deployment)
- Worked example: a 5% canary with 20% errors gives 1% overall. "If we instead use a canary population of 5%, we serve 20% errors for 5% of traffic, resulting in a 1% overall error rate" (Minimizing Risk to SLOs and the Error Budget)
- Budget impact is proportional to exposed traffic. "impact on the budget is directly proportional to the amount of traffic exposed to defects." (Minimizing Risk)
- Run one canary at a time. "We strongly advise running only one canary deployment at a time." (Choosing a Canary Population and Duration)
- Performance bugs show only under load, so off-peak canaries miss them. "Performance defects typically manifest only under heavy load,⁷ so deploying at an off-peak time likely wouldn’t trigger performance-related defects." (Time of day)
- Start from SLIs. "We typically recommend using SLIs as a place to start thinking about canary metrics." (Metrics Should Indicate Problems)
- Keep it to about a dozen metrics. "Select the top few metrics to use in canary evaluations (perhaps no more than a dozen)." (Metrics Should Indicate Problems)
- Noisy metrics like CPU get the canary ignored. "This can result in the canary process being disabled or ignored by operators, which can defeat the point of having a canary process in the first place." (Metrics Should Indicate Problems)
- Exclude 4xx codes, use black-box probes instead. "Often we can work around problems like this by excluding 400-level codes from our canary evaluation and adding black-box monitoring to test for the presence of a particular URL." (Metrics Should Indicate Problems)
- Before/after comparison is risky because time changes metrics. "Because time is one of the biggest sources of change in observed metrics, it is difficult to assess degradation of performance with before/after evaluation." (Before/After Evaluation Is Risky)
- Multi-stage canaries: small first stage uses the clearest signals. "In a small canary, we prefer metrics that are the clearest indication of a problem—application crashes, request failures, and the like." (Use a Gradual Canary)
- Shared infrastructure means a bad canary can hurt the control; also check absolute SLOs. "It is important to also use absolute measures, such as defined SLOs, to ensure the system is operating correctly." (Dependencies and Isolation)
- Metrics must be broken down by canary vs control. "it is important to be able to perform fine-grained breakdowns that enable you to differentiate metrics between the canary and control populations." (Requirements on Monitoring Data)
- Metric windows must not be longer than the canary. "make sure the intervals of your metrics are either the same as or less than your canary duration." (Requirements on Monitoring Data)
- Blue/green doubles resources and is a before/after canary. "One downside is that this setup uses twice as many resources as a more “traditional” deployment. In this setup, you are effectively performing a before/after canary" (Blue/Green Deployment)
- Traffic teeing: canary serves a copy and discards responses. "While the production system serves the actual traffic and delivers responses to users, the canary deployment serves the copy and discards the responses." (Traffic Teeing)
- Long before/after comparisons mix weekdays with weekends. "we may be comparing behavior during a business day to behavior during a weekend, introducing a large amount of noise." (Before/After Evaluation Is Risky)
- Running blue and green together with a traffic split makes blue/green a canary. "You can use blue/green deployments more or less as normal canaries by utilizing both blue and green deployments simultaneously (rather than independently)." (Blue/Green Deployment)
- A 404 can come from a broken URL shared elsewhere. "imagine a broken URL getting shared on a popular discussion board" (Metrics Should Indicate Problems)
- CPU rises don't always hurt users. "an increase in resource usage doesn't necessarily impact a service and may result in a flaky or noisy canary process." (Metrics Should Indicate Problems)
- A canary response can change the client's next request, which lands on the control. "The response by the canary may change the content of the second request, which may land on the control, altering the control's behavior." (Dependencies and Isolation)
- A failed canary isn't proof the canary is at fault. "the canary deployment isn't necessarily at fault." (Dependencies and Isolation)

## Visuals worth redrawing

- Figures 16-3 and 16-4: overall error rate barely moves while the
  per-version breakdown shows the canary failing. Redraw as a schematic
  without numbers beyond the 5%/20%/1% example.

## My notes

- The 5%/20%/1% example assumes uniform load.
