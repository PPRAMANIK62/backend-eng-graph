---
id: maccarthaigh-shuffle-sharding
title: Workload isolation using shuffle-sharding (Amazon Builders' Library)
author: Colm MacCárthaigh (Amazon)
url: https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/
kind: blog
primary: true
---

## Summary

How the Route 53 team invented shuffle sharding to survive DDoS attacks.
Compares no sharding, plain sharding and shuffle sharding on a fleet of
eight workers, then gives Route 53's real numbers. The aws.amazon.com URL
now redirects to builder.aws.com, which renders with JavaScript; the
text was read with headless Chromium.

## Key claims

- Without sharding, a bad request or flood can cascade through every worker. "The problem will take out the first worker impacted, but then proceed to cascade through the other workers as the remaining workers take over." (What is shuffle sharding?)
- With 4 shards of 2 workers, impact drops to a quarter. "A 25 percent impact is much better than a 100 percent impact." (What is shuffle sharding?)
- Plain sharding needs more slack capacity. "because there are only two workers per shard, we have to keep more slack capacity in the system to handle any failures." (What is shuffle sharding?)
- Shuffle sharding gives each customer its own random pair of workers ("virtual shards"). "With shuffle sharding we create virtual shards of two workers each, and we assign our customers or resources, or whatever we want to isolate, to one of those virtual shards." (What is shuffle sharding?)
- Another shard shares at most one worker with the affected one. "In fact, at most one of another shuffle shard’s workers will be affected." (What is shuffle sharding?)
- It only helps if clients can work around one bad worker, e.g. by retrying. "If the requestors are fault tolerant and can work around this (with retries for example), service can continue uninterrupted for the customers or resources on the remaining shards" (What is shuffle sharding?)
- 8 workers give 28 pairs, so impact is 1/28, 7 times better than plain sharding. "That’s 7 times better than regular sharding." (What is shuffle sharding?)
- Route 53: 2048 virtual name servers, four per domain. "We then assign every customer domain to a shuffle shard of four virtual name servers." (Amazon Route 53 and shuffle sharding)
- That gives about 730 billion shuffle shards. "With those numbers, there are a staggering 730 billion possible shuffle shards." (Amazon Route 53 and shuffle sharding)
- No two domains share more than two name servers. "we can go further, and ensure that no customer domain will ever share more than two virtual name servers with any other customer domain." (Amazon Route 53 and shuffle sharding)
- Usually no extra cost. "It also usually comes at no additional cost" (Conclusion)
- Plain sharding trades efficiency for scope of impact. "If we divide the fleet into 4 shards of workers, we can trade efficiency for scope of impact." (What is shuffle sharding?)
- A problem can still take out a quarter of the workers; what changes is who is hurt. "When a problem happens, we can still lose a quarter of the whole service, but the way that customers or resources are assigned means that the scope of impact with shuffle sharding is considerably better." (What is shuffle sharding?)
- It gets better as the fleet grows. "Most scaling challenges get harder in those dimensions, but shuffle sharding gets more effective." (What is shuffle sharding?)
- With enough workers every customer can be isolated. "In fact, with enough workers, there can be more shuffle shards then there are customers, and each customer can be isolated." (What is shuffle sharding?)
- The virtual name servers aren't physical servers and can be moved. "These servers are virtual because they don’t correspond to the physical servers hosting Route 53." (Amazon Route 53 and shuffle sharding)
- An attacked domain can be moved to dedicated capacity. "Shuffle sharding means that we can identify and isolate the targeted customer to special dedicated attack capacity." (Amazon Route 53 and shuffle sharding)
- Recursive shuffle sharding shards at several layers. "such as recursive shuffle sharding, where we shard items at multiple layers, thus isolating a customer’s customer." (Conclusion)
- The motive was DDoS: capacity alone is a losing game. "For providers, adding huge volumes of server capacity is a losing strategy." (Handling DDoS attacks)
- The payoff: shared services that feel single-tenant. "it’s become a core pattern that makes it possible for AWS to deliver cost-effective multi-tenant services that give each customer a single-tenant experience." (What is shuffle sharding?)

## Visuals worth redrawing

- Eight workers with customers assigned to overlapping pairs (rainbow on workers 1 and 4, rose on 1 and 8), showing that a failure of rainbow's pair leaves rose and sunflower with one healthy worker each.

## My notes

- Route 53 Infima library holds implementations; its README is in
  awslabs-route53-infima.
- A reader comment asks whether virtual servers on shared physical hosts weaken the isolation; not answered in the article.
- Re-read on builder.aws.com (headless Chromium) for the shuffle-sharding
  node; same content as before.
