---
id: github-mysql-failover-incident-2018
title: "Post-incident analysis of GitHub's 2018 MySQL failover (GitHub blog)"
author: Jason Warner (GitHub)
url: https://github.blog/news-insights/company-news/oct21-post-incident-analysis/
kind: blog
primary: true
---

## Summary

GitHub's analysis of its 2018 outage. A 43-second network cut between
its East Coast hub and data center let Orchestrator, its Raft-based
failover manager, promote West Coast MySQL primaries. The East Coast
primaries held a few seconds of writes that never reached the West, so
both sides had writes the other lacked and failing back wasn't safe.
Recovery meant restoring from backups and took about a day.

## Key claims

- A short cut, a long outage. "Connectivity between these locations was restored in 43 seconds, but this brief outage triggered a chain of events that led to 24 hours and 11 minutes of service degradation." (Background)
- The cause was maintenance on optical equipment between the East Coast hub and the main East Coast data center. "routine maintenance work to replace failing 100G optical equipment resulted in the loss of connectivity between our US East Coast network hub and our primary US East Coast data center." (Background)
- Failover was automated by Orchestrator. "We use Orchestrator to manage our MySQL cluster topologies and handle automated failover." (Background)
- Orchestrator runs on Raft. "Orchestrator considers a number of variables during this process and is built on top of Raft for consensus." (Background)
- The other side formed a quorum and failed over. "The US West Coast data center and US East Coast public cloud Orchestrator nodes were able to establish a quorum and start failing over clusters to direct writes to the US West Coast data center." (Incident timeline)
- Once the link was back, the application tier wrote to the new West Coast primaries. "When connectivity was restored, our application tier immediately began directing write traffic to the new primaries in the West Coast site." (Incident timeline)
- Both sides had writes the other didn't, so they couldn't fail back. "Because the database clusters in both data centers now contained writes that were not present in the other data center, we were unable to fail the primary back over to the US East Coast data center safely." (Incident timeline)
- How many writes were stranded on one cluster. "For example, one of our busiest clusters had 954 writes in the affected window." (Resolving data inconsistencies)
- Those needed manual reconciliation. "manual reconciliation for a few seconds of database writes is still in progress." (opening)
- The new primaries were too far away for the apps. "applications running in the East Coast that depend on writing information to a West Coast MySQL cluster are currently unable to cope with the additional latency introduced by a cross-country round trip for the majority of their database calls." (Incident timeline)
- The tool did what it was set up to do. "Orchestrator’s actions behaved as configured, despite our application tier being unable to support this topology change." (Technical initiatives)
- They had never seen an internal partition this big. "This was emergent behavior of the system given that we hadn’t previously seen an internal network partition of this magnitude." (Technical initiatives)
- The fix: no promotion across regions. "Adjust the configuration of Orchestrator to prevent the promotion of database primaries across regional boundaries." (Technical initiatives)
- Restoring from backup took hours. "The time required to restore multiple terabytes of backup data caused the process to take hours." (Incident timeline)
- Replicas caught up slower than a straight line predicted. "In reality, the time required for replication to catch up had adhered to a power decay function instead of a linear trajectory." (Incident timeline)
- The West took new writes for a long time. "by this point the West Coast database cluster had ingested writes from our application tier for nearly 40 minutes." (Incident timeline)
- They chose consistency over a quick recovery. "We believe that the extended degradation of service was worth ensuring the consistency of our users’ data." (Incident timeline)
- The stranded writes were kept in binary logs. "we captured the MySQL binary logs containing the writes we took in our primary site that were not replicated to our West Coast site from each affected cluster." (Resolving data inconsistencies)

## Visuals worth redrawing

- Normal topology vs the invalid one after failover (West primaries,
  East apps reading stale replicas).

## My notes

- The page title names the calendar day of the incident; this note's
  title leaves it out.
