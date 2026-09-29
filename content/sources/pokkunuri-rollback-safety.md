---
id: pokkunuri-rollback-safety
title: Ensuring rollback safety during deployments
author: Sandeep Pokkunuri, Amazon Builders' Library (now on AWS Builder Center)
url: https://builder.aws.com/content/3F04j2yRAAMBuPSPs50xwXZqg01/ensuring-rollback-safety-during-deployments
kind: blog
primary: true
---

## Summary

Why a rollback can fail in a distributed system, and Amazon's
two-phase (prepare, activate) deployment to keep every step reversible.
Originally a Builders' Library article; the old URL redirects here.

## Key claims

- In a rolling deploy, old and new versions talk to each other. "The writer and the reader could be running different versions of the software. As a result, they could interpret the data differently." (Standalone vs. distributed software deployments)
- Protocol changes are the most common reason rollback fails. "We found that the most common reason for not being able to roll back is a change of protocol." (Problems with protocol changes)
- Once new data is written, rollback is off the table. "After the new version writes some compressed data, rolling back isn’t an option." (Problems with protocol changes)
- Even a timer change is a protocol change: heartbeats from 5 to 10 seconds make old servers drop connections to new ones. "The code commit seems minor—just a number change. However, now it isn’t safe to both roll forward and backward." (Problems with protocol changes)
- Two-phase deployment: first teach everyone to read the new format, then start writing it. "In this phase, we prepare all the servers to read JSON (in addition to XML) but they continue to write XML by deploying version V2." (Two-phase deployment technique)
- Verify every server reached the prepare phase. "Therefore, we explicitly verify that all the servers have picked up the change in the Prepare phase." (Precautions)
- You can't roll back both phases, so wait days between them. "While each of the two phases is safe for rolling back, we can’t roll back both changes." (Precautions)
- Readers first when rolling forward, writers first when rolling back. "readers go before writers while rolling forward whereas writers go before readers while rolling backward." (Verifying that a change is safe for rollback)
- A one-server test environment hides the mixed-version problem. "Thus, all deployments were atomic which precluded the possibility of running different versions of the software concurrently." (Verifying that a change is safe for rollback)
- A few days between prepare and activate. "We let a considerable period of time pass between the Prepare and Activate phases. We call this time the bake period, and its duration is usually a few days." (Precautions)
- The fix for one-server test environments. "Now, even if test environments don't see as much traffic as production environments, we use multiple servers from different Availability Zones behind each service, just as it would be in production." (Verifying that a change is safe for rollback)

## Visuals worth redrawing

- V1 (XML), V2 (read both, write XML), V3 (read both, write JSON).

## My notes

- Same idea as expand/contract for schemas and as schema evolution for
  messages.
