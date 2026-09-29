---
id: brooker-metastability-2021
title: Metastability and Distributed Systems
author: Marc Brooker
url: https://brooker.co.za/blog/2021/05/24/metastable.html
kind: blog
primary: false
---

## Summary

An AWS engineer's review of the Bronson et al. paper. Explains the "up
but down" state with a queue example, agrees the sustaining loop is the
root cause, questions some of the proposed fixes, and argues retries
added to lower daily error rates can make a system more fragile.

## Key claims

- Queue example: a backlog raises latency, clients time out, the server keeps doing work nobody waits for, so goodput is zero. "None of the work is useful, though, because clients aren’t waiting for the results, so goodput is zero." (opening section)
- The state is stable without an outside push. "The system is mostly stable in this state, and without an external kick, could continue going along that way indefinitely." (opening section)
- Switching policy under overload adds hard-to-reason-about modes. "Changing policy during overload introduces modal behavior that can be hard to reason about (and modes are bad)." (Is there a cure?)
- Priorities are hard for many systems. "Prioritization and fairness are good if you can get them, but many systems can’t" (Is there a cure?)
- More retries lower the everyday error rate but make the system more vulnerable. "However, the same change can make systems more vulnerable, by converting small outages into sudden (and metastable) periods of internal retry storms." (Is there a cure?)
- Fixing only triggers misses the next similar outage. "focusing on just fixing the triggering causes of issues causes us to fail to prevent similar issues with slightly different causes in future." (Is there a cure?)
- The idea is well known outside computing. "These kinds of issues are well known in the world of control systems, in health care, in operations research, and other fields." (Where do we go?)
- He had described it earlier as bistability. "although framed the issue as a bistability rather than metastability." (footnote 1)

## Visuals worth redrawing

None.

## My notes

- Pairs with brooker-caches-modes-2021 (the cache version of the same loop).
