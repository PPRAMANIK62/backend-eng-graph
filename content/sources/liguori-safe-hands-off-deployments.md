---
id: liguori-safe-hands-off-deployments
title: Automating safe, hands-off deployments
author: Clare Liguori, Amazon Builders' Library (now on AWS Builder Center)
url: https://builder.aws.com/content/3ErTKQOTKc5NIw031UePBPxTQ6I/automating-safe-hands-off-deployments
kind: blog
primary: true
---

## Summary

How Amazon's continuous deployment pipelines take a merged change to
production with nobody watching: source, build, pre-production stages,
one-box and rolling deploys, waves of regions, alarms that roll back
automatically, and bake time. Originally a Builders' Library article;
the old aws.amazon.com/builders-library URL now redirects here.

## Key claims

- After the merge, nobody touches the change. "the last time I or any other developer touches or reviews a piece of code is when it is merged into the source code repository." (Safe continuous deployments at Amazon)
- Four phases. "A typical continuous delivery pipeline has four major phases—source, build, test, and production (prod)." (The four pipeline phases)
- Config and flags go through their own pipeline with the same safety. "a feature flags pipeline uses the same safe deployment techniques as the application code pipeline, because a bad feature flag configuration change can have an impact on production just as a bad application code change can." (Pipeline sources)
- Builds have no network. "All builds run without network access to isolate the builds and encourage build reproducibility." (Build and unit tests)
- One-box stage checks the new code alongside the old. "Before deploying to production, we need to ensure that the latest code is backward-compatible and can be safely deployed alongside the current code." (Backward compatibility and one-box testing)
- Limit scope to one AZ or cell at a time. "Our #1 objective for production deployments at AWS is to prevent negative impact to multiple Regions at the same time and to multiple Availability Zones in the same Region." (Production deployments)
- Waves of increasing size. "We have found that grouping deployments into “waves” of increasing size, as seen in the previous sample prod pipeline, helps us achieve a good balance between deployment risk and speed." (Staggered deployments)
- The first wave is a low-traffic region. "The first wave deploys to a Region with a low number of requests to limit the possible impact of the first production deployment of the new change." (Staggered deployments)
- A prod one-box serves at most 10% of the region or AZ's requests. "Typically, the one box serves at most ten percent of overall requests for the Region or Availability Zone." (One-box and rolling deployments)
- Rolling deploys replace at most 33% at a time. "In a typical rolling deployment to a Region, at most 33 percent of the service’s boxes in that Region (containers, Lambda invocations, or software running on virtual machines) are replaced with the new code." (One-box and rolling deployments)
- At least 66% stays serving. "During the replacement, at least 66 percent of the overall capacity is healthy and serving requests." (One-box and rolling deployments)
- Some deploy 5% at a time but roll back 33% at a time. "some teams’ pipelines deploy as little as five percent of their boxes at a time. However, then they do fast rollbacks, where the system replaces 33 percent of the boxes at a time with the previous code to speed up rollback." (One-box and rolling deployments)
- An alarm, not a person, triggers rollback. "The deployment system actively monitors an alarm to determine if it needs to automatically roll back a deployment." (Metrics monitoring and auto-rollback)
- Rollback often starts before the on-call is paged in. "Often, the rollback is already in progress by the time the oncall engineer has been paged and starts engaging." (Metrics monitoring and auto-rollback)
- One-box alarms use metrics scoped to the one box. "one-box stages additionally roll back on metrics that are scoped to only the one box." (Metrics monitoring and auto-rollback)
- Bake time catches slow-burning problems. "Sometimes a negative impact caused by a deployment is not readily apparent. It’s slow burning." (Bake time)
- Typical bake: 1 hour after one-box, 12 hours after the first wave, 2 to 4 hours after later waves. "A typical pipeline waits at least one hour after each one-box stage, at least 12 hours after the first regional wave, and at least two to four hours after each of the rest of the regional waves" (Bake time)
- Wait for enough requests, not only time. "wait for at least 100 requests to the Create API" (Bake time)
- About four or five business days to reach all Regions. "the typical pipeline’s default bake times are conservative and will deploy a change to all Regions in about four or five business days." (Bake time)
- A microservice has several pipelines. "A typical microservice might have an application code pipeline, an infrastructure pipeline, an OS patching pipeline, a configuration/feature flags pipeline, and an operator tools pipeline." (Pipeline sources)
- Two thirds is enough because services survive losing a zone. "All services are scaled to withstand losing an Availability Zone in the Region, so we know that the service can still serve production load at this capacity." (One-box and rolling deployments)
- A one-box is a single VM or container. "deploys the latest code to the smallest unit of deployment, such as to a single virtual machine or single container, or to a small percentage of AWS Lambda function invocations." (Backward compatibility and one-box testing)

## Visuals worth redrawing

- The sample prod pipeline: one-box, then waves of regions. Redraw as a
  timeline of stages with bake time between them.

## My notes

- Amazon's numbers (33%, 10%, bake times) are theirs, for their scale.
