---
id: aws-multi-region-fundamentals
title: AWS multi-Region fundamentals (AWS Prescriptive Guidance)
author: John Formento (AWS)
url: https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/aws-multi-region-fundamentals/aws-multi-region-fundamentals.pdf
kind: docs
primary: true
---

## Summary

AWS guidance on whether and how to run a workload in several Regions.
Most workloads should stay in one Region with several Availability
Zones. For the few that go multi-Region, it covers why (bounded
recovery, data sovereignty, latency), the data choice (asynchronous
replication and reconciliation vs synchronous replication and higher
latency), read local / write global, active-active costs, sharding
clients across Regions, dependencies, failover mechanisms and testing.

## Key claims

- Three reasons to go multi-Region: bounded recovery, data sovereignty, latency. "They need to satisfy data sovereignty requirements (such as adherence to local laws, regulations, and compliance) that require workloads to operate within a certain jurisdiction." (Introduction)
- Most workloads don't need it. "Most AWS users can achieve their resilience objectives for a workload in a single Region by using multiple Availability Zones or Regional AWS services." (Introduction)
- Done wrong, it lowers availability. "if the multi-Region architecture isn't built correctly, it's possible for the overall availability of the workload to decrease." (Introduction)
- Detection and response time eat a 99.99% budget. "It's not unusual to take 30 to 45 minutes to recover from a single issue." (Fundamental 1)
- Cost roughly doubles. "A typical multi-Region architecture can incur a cost that's twice as large as a single-Region approach." (Fundamental 1)
- Distance means replication delay. "The geographical distance between Regions imposes an unavoidable latency that manifests as the time it takes to replicate data across Regions." (Fundamental 2)
- Async replication leaves writes behind in a failed Region. "With asynchronous replication, when there is a failure in the primary Region, there is a high probability that write operations will be pending replication from the primary Region." (2.a)
- Reconciliation is business logic, not a database feature. "This requires specific business logic and is not something that is handled by the data store itself." (Fundamental 2, Key guidance)
- Synchronous cross-Region replication typically means three Regions and a quorum of two. "This typically involves setting up your database in three Regions and establishing a quorum of two out of three Regions." (2.a)
- Synchronous writes get much slower. "When writes involve synchronous replication across multiple Regions to meet strong consistency requirements, write latency increases by an order of magnitude." (2.a)
- Read local, write global. "This means that all write requests go to a database in a specific Region, the data is replicated asynchronously to all other Regions, and reads can be done in any Region." (2.b)
- For write-heavy workloads, pick a primary and engineer failover. "For write-intensive workloads, a primary Region should be selected and the capability to fail over to a standby Region should be engineered into the workload." (2.b)
- What active-active makes you rewrite. "for an active-active architecture, the workload has to be rewritten to handle intelligent routing to Regions, establish session affinity, ensure idempotent transactions, and handle potential conflicts." (2.b)
- Most don't need active-active. "Most workloads that use a multi-Region approach for resilience won't require an active-active approach." (2.b)
- Shard clients across Regions, each shard with its own primary. "If you can effectively shard a client base, you can select different primary Regions for each shard." (2.b)
- No cross-Region calls between services. "Cross-Region calls between microservices within a workload are not advised, and Regional isolation should be maintained." (3.b)
- Failover must not depend on the failed Region. "Failover controls should work with no dependencies on the primary Region." (Fundamental 3, Key guidance)
- DNS is the common failover lever. "DNS is commonly used as a failover mechanism to shift traffic away from the primary Region to a standby Region." (3.c)
- Fail over a whole user journey together. "all microservices that are part of the business capability should fail over together to remove the chance of cross-Region calls." (3.c)
- Untested recovery is no recovery. "Having an untested recovery approach is equal to not having a recovery approach." (4.e)
- Deploy one Region at a time. "You need to make sure that you deploy to one Region at a time." (4.b)
- The 99.99% budget. "For example, if a workload requires 99.99 percent availability, no more than 53 minutes of downtime per year is tolerable." (Fundamental 1)
- Detection and engagement alone take a big share. "It can take at least 5 minutes to detect a failure and another 10 minutes for an operator to engage, make decisions on recovery steps, and perform these steps." (Fundamental 1)
- A second Region lets you fail over within a bounded time. "This allows for continued operations by failing over within a bounded time while you triage the initial impairment independently." (Fundamental 1)
- Aurora global database: one writer Region, up to five readers. "An Aurora global database consists of one primary Region where your data is written, and up to five read-only secondary Regions." (2.a)
- Read local, write global means stale local reads. "This approach requires a workload to embrace eventual consistency, because local reads might become stale as a result of increased latency for cross-Region replication of writes." (2.b)
- Regions as cells. "By treating Regions as cells, you can create a multi-Region cell approach, which results in reducing the scope of impact for your workload." (2.b)
- Failover tooling can depend on the Region you're leaving. "if your workload uses Amazon Route 53, understanding that the control plane is hosted in us-east-1 means you are taking a dependency on the control plane in that specific Region." (3.c)
- Keep certificates, keys and secrets per Region; stagger certificate expiry. "you should vary the expiration dates of certificates to prevent a scenario where an expiring certificate (with alarms set to "notify in advance") impacts multiple Regions." (3.d)
- Make switching Regions routine. "We recommend that you build the capability to switch Regions into your normal operating posture; however, this test alone is not enough." (4.e)
- Watch the primary from the standby Region. "This includes having health checking and canaries (synthetic testing) running from the standby Region to provide an outside view of the health of the primary Region." (4.c)
- Hot standby is lowest risk and doubles cost. "the pattern with the lowest risk of meeting recovery objectives will involve running hot standby, and will double the cost for your workload." (Fundamental 1)
- Partitions between Regions are a given. "By definition, a multi-Region architecture includes network partitions between Regions, so you have to choose between availability and consistency." (2.a)
- Higher write latency can't be retrofitted. "A higher write latency is not something that you can typically retrofit into an application without significant changes, such as revisiting the timeout and retry strategy for your application." (2.a)
- Partial failover leads to cross-Region calls and timeouts. "This introduces latency and could lead to the workload becoming unavailable during client timeouts." (3.c)
- Practise failover and failback. "Teams should also go through normal failover and failback exercises to feel comfortable with runbooks that would be used during an event." (4.f)

## Visuals worth redrawing

- The resilience tier tables (availability, RTO, RPO). Not redrawn.

## My notes

- The guide's HTML landing page only served a JavaScript redirect to
  curl, so the PDF of the same guide was read in full. The HTML pages
  for fundamentals 1 and 2 did load and match the PDF. The PDF is
  copyright 2026, so this is the current edition.
