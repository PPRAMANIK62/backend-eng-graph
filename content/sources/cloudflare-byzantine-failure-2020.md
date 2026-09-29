---
id: cloudflare-byzantine-failure-2020
title: A Byzantine failure in the real world
author: Tom Lianza and Chris Snook (Cloudflare)
url: https://blog.cloudflare.com/a-byzantine-failure-in-the-real-world/
kind: blog
primary: true
---

## Summary

Cloudflare's postmortem (2020) of a control-plane outage of six hours and
33 minutes. A switch failed partially, so one etcd member could reach one
peer but not the leader. The etcd cluster kept holding elections and
couldn't accept writes, which set off a database failover and an
overloaded primary. A postscript says the fault is better called an
omission fault than a Byzantine one.

## Key claims

- API and dashboard were impaired for six hours and 33 minutes. "impacted the availability of the API and dashboard for six hours and 33 minutes." (intro)
- The switch was half working: control-plane protocols up, forwarding not. "The device was in a partially operating state" (Partial Switch Failure)
- The link picture: node 1 to leader node 3 broken, node 1 to node 2 fine, node 2 to node 3 fine. "Network traffic between node 1 (in the affected rack) and node 3 (the leader) was being sent through the switch in the degraded state" (etcd Errors begin)
- Node 1 kept starting elections; node 2 kept voting for node 3. "node 1 repeatedly initiated leader elections, voting for itself, while node 2 repeatedly voted for node 3, which it could still connect to." (etcd Errors begin)
- Elections block writes, so etcd was read-only until the switch recovered. "RAFT leader elections are disruptive, blocking all writes until they're resolved, so this made the cluster read-only until the faulty switch recovered" (etcd Errors begin) [curly apostrophe]
- The switch recovered on its own after six minutes, but the effects lasted much longer. "Six minutes later, the switch recovered without human intervention." (Partial Switch Failure)
- etcd being read-only triggered automatic database primary promotion. "When etcd became read-only, two clusters were unable to communicate that they had a healthy primary database." (Database system promotes...)
- Postscript: it was an omission fault. "the failure we've encountered would be better characterized as an omission fault rather than a Byzantine fault." (Postscript) [curly apostrophe]

## Visuals worth redrawing

- Three etcd nodes with one broken link (node 1 to node 3).

## My notes

- The post doesn't say whether PreVote or CheckQuorum were enabled in their
  etcd. Don't claim either.
