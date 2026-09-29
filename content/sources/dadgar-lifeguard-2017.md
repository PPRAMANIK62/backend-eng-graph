---
id: dadgar-lifeguard-2017
title: "Lifeguard: Local Health Awareness for More Accurate Failure Detection"
author: Armon Dadgar, James Phillips and Jon Currey (HashiCorp)
url: https://arxiv.org/abs/1707.00788
kind: paper
primary: true
---

## Summary

HashiCorp's paper (arXiv 1707.00788, v2) on false positives in SWIM, as
run in their memberlist library under Consul and Nomad. A member that is
itself slow (CPU starved, dropping packets) wrongly declares healthy peers
dead. Lifeguard makes each member take its own health into account:
back off its probes when it's missing acks, start suspicion timeouts high
and shorten them as other members agree, and tell a suspected member
first so it can refute.

## Key claims

- Slow message processing makes SWIM mark healthy members as failed, despite the suspicion step. "slow message processing can cause SWIM to mark healthy members as failed (so called false positive failure detection), despite inclusion of a mechanism to avoid this." (Abstract)
- Causes of slow processing. "Slow message processing can be caused by a wide variety of factors, including CPU contention, network delay or loss" (I)
- Flapping is expensive when it triggers failover. "This ‘flapping’ can be very costly if it induces repeated failover operations, such as provisioning members or re-balancing data." (I)
- The fix is to let each detector consider that it might be the faulty one. "The approach used is to make each instance of SWIM’s failure detector consider its own health, which we refer to as local health." (I)
- memberlist underpins Consul and Nomad; deployments beyond 6,000 members in one group. "deployments with more than 6,000 members in a single group." (I)
- Experiment: 100 single-core VMs on Azure; even one overloaded member caused false positives, and 4 overloaded members caused hundreds at healthy members. "for SWIM, even a single overloaded member is sufficient to cause some false positive failure detection events" (II, Figure 1)
- Gossip makes membership weakly consistent. "different members may have a different view of the group membership at a given point in time." (II)
- LHA-Probe: a saturating local health counter scales the probe interval and timeout; memberlist defaults 1 s and 500 ms, backing off to 9 s and 4.5 s. "S defaults to 8, which means the probe interval and timeout will back off as high as 9 seconds and 4.5 seconds, respectively." (IV-A)
- LHA-Suspicion: suspicion timeouts start high and shrink as independent suspicions arrive. "The timeout for each new suspicion starts significantly higher than it would in the fixed case, but is reduced as independent suspicions about the same suspected member are processed." (IV)
- Only the suspected member can raise its incarnation number, to refute. "only the suspected member can increment its incarnation number." (III, footnote 3)
- memberlist renames SWIM's confirm message to dead. "In memberlist, the confirm message is renamed to dead" (III, footnote 4)
- Result: full Lifeguard cut false positives by 50x to 100x in their controlled tests. "full Lifeguard (Lifeguard) reduces the number of false positives by a factor of between 50x and 100x." (V)

## Visuals worth redrawing

- Figure 1: false positives against number of stressed machines, SWIM vs Lifeguard.

## My notes

- The numbers are HashiCorp's own tests on their implementation.
