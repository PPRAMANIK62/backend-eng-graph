---
id: github-availability-2012
title: "GitHub availability this week"
author: Jesse Newland (GitHub)
url: https://github.blog/news-insights/the-library/github-availability-this-week/
kind: blog
primary: true
---

## Summary

GitHub's 2012 write-up of two outages caused by automated MySQL
failover. Load from a migration failed health checks and triggered a
failover to a replica with a cold cache, which then failed back. The
next day a cluster-manager crash split the cluster, an out-of-date node
was elected primary, and data drifted until it was powered off. GitHub
turned automatic failover off for its main database.

## Key claims

- The setup: a three-node MySQL cluster managed by Pacemaker. "These virtual IPs are managed by Pacemaker and Heartbeat, a high availability cluster management stack that we use heavily in our infrastructure." (First, some background)
- Load from a migration failed the health checks. "So high, in fact, that they caused Percona Replication Manager’s health checks to fail on the master." (first outage)
- The new primary was slow on a cold cache. "At the time of this failover, the new database selected for the ‘active’ role had a cold InnoDB buffer pool and performed rather poorly." (first outage)
- So it failed back. "the ‘active’ role failed back to the server it was on originally." (first outage)
- A majority rule was configured and still two elections ran. "Despite having configured the cluster to require a majority of machines to agree on the state of the cluster before taking action, two simultaneous master election decisions were attempted without proper coordination." (second outage)
- The node elected was the stale one. "As luck would have it, the ‘c’ node was the node that our operations team previously determined to be out of date." (second outage)
- Links between MySQL IDs and Redis broke. "the cross-data-store foreign key relationships became out of sync for records created during this window." (second outage)
- Users saw other users' data. "Consequentially, some events created during this window appeared on the wrong users’ dashboards." (second outage)
- Including private repositories. "16 of these repositories were private" (second outage)
- Nobody would have approved these failovers. "if any member of our operations team had been asked if the failover should have been performed, the answer would have been a resounding no." (In ops I trust)
- Failover became manual. "we’ve made changes to our Pacemaker configuration to ensure failover of the ‘active’ database role will only occur when initiated by a member of our operations team." (In ops I trust)
- Redis looked data up by MySQL IDs. "We use Redis to query dashboard event stream entries and repository routes from automatically generated MySQL ids." (second outage)
- How long the private repositories were exposed. "16 of these repositories were private, and for seven minutes" (second outage)
- Health checks were turned off after the flip-flop. "At this point, I decided to disable all health checks by enabling Pacemaker’s maintenance-mode" (first outage)
- The split came from a cluster-manager crash. "Upon attempting to disable maintenance-mode , a Pacemaker segfault occurred that resulted in a cluster state partition." (second outage)
- The stale node was elected at 8:19 and powered off at 8:26. "node ‘c’ was elected at 8:19 AM" and "powered off this out-of-date node at 8:26 AM to end the partition" (second outage)
- Powering it off took the site down. "taking down all production database access and thus all access to github.com" (second outage)
- The second outage was the following morning. "The following morning, our operations team was notified by a developer of incorrect query results" (second outage)

## Visuals worth redrawing

None.

## My notes

- The post says Redis looked up data by MySQL-generated IDs, and records
  made during the window got out of sync. It doesn't spell out the
  mechanism beyond that; don't add one.
