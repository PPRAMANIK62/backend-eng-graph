---
id: aws-builders-leader-election
title: Leader election in distributed systems (Amazon Builders' Library)
author: Marc Brooker (Amazon)
url: https://aws.amazon.com/builders-library/leader-election-in-distributed-systems/
kind: blog
primary: true
---

## Summary

How Amazon uses leader election: what a leader is good for, what it costs
(single point of failure, scaling and trust), why leases in a database
are Amazon's usual mechanism, why they rely on elapsed durations rather
than synchronized clocks, and why a system must survive zero or two
leaders at once. Ends with practical rules (check the lease before side
effects, don't heartbeat from a background thread).

## Key claims

- Definition: giving one thing special powers. "Leader election is the simple idea of giving one thing (a process, host, thread, object, or human) in a distributed system some special powers." (intro)
- They look for alternatives first: idempotent APIs, optimistic locking. "For other systems, we often implement idempotent APIs, optimistic locking, and other patterns that make a single leader unnecessary." (intro)
- Upside: one place for all the concurrency. "It puts all the concurrency in the system into a single place, reduces partial failure modes, and adds a single place to look for logs and metrics." (Advantages and disadvantages)
- Downside: single point of failure, of scaling, of trust. "A single leader is a single point of failure." (Advantages and disadvantages)
- Sharding gives many leaders, each owning part of the data. "Each item of data still belongs to a single leader, but the whole system contains many leaders." (Advantages and disadvantages)
- Leases are Amazon's most used mechanism: a database stores the leader, who heartbeats. "Leases are the most widely used leader election mechanism at Amazon." (How Amazon elects a leader)
- "Leases work by having a single database that stores the current leader." (How Amazon elects a leader)
- Leases depend on elapsed local durations, not agreed wall-clock time. "However, they depend only on local elapsed time duration, rather than a wall-clock time that is synchronized and needs to be agreed upon by multiple servers." (How Amazon elects a leader)
- A clock that seems to jump backwards breaks the lease's assumptions. "if a server or library that measures time thought that time jumped backwards occasionally, it would break the assumptions about time durations that are built into leases." (How Amazon elects a leader)
- The hard part is making sure the leader only works while holding the lease; GC pauses between check and work cause errors. "Similarly, garbage collection pauses between a lock being checked and work being done can lead to incorrect behavior." (How Amazon elects a leader)
- They prefer existing lease clients (DynamoDB lock client, ZooKeeper) over custom code. "Amazon teams prefer to avoid creating a custom leader election implementation." (How Amazon elects a leader)
- There can be zero or two leaders during failures. "Instead, there can mostly be one leader, and there can be either zero leaders or two leaders during failures." (What happens when the leader fails?)
- Idempotent work lets a new leader redo what the old one may have half done. "It allows the new leader to confidently redrive work that the outgoing leader may have partially completed or completed but didn't tell others about." (What happens when the leader fails?)
- Deposing the old leader before electing a new one is hard. "it must ensure that the outgoing leader is deposed before a new leader is elected, which is harder than it seems." (What happens when the leader fails?)
- Check the lease before any side effect. "Check the remaining lease time (or lock status in general) frequently, and especially before initiating any operation that has side-effects beyond the leader itself." (Best practices)
- Don't heartbeat from a background thread. "Avoid heartbeating leases in a background thread." (Best practices)
- Slow networks, timeouts, retries and GC pauses can use up the lease before the code expects. "Consider that slow networking, timeouts, retries, and garbage collection pauses can cause the remaining lease time to expire before the code expects it to." (Best practices)
- Why not a background heartbeat thread: it may not be able to stop the work, and the work may die while it keeps the lease. "Availability issues can occur if the work thread dies or stops while the heartbeating thread holds on to the lease." (Best practices)
- Keep a log of leadership changes. "Keep an audit trail or log of leadership changes." (Best practices)
- Use a separate mechanism (like the database) for correctness when two leaders overlap. "they might use an underlying database to make sure that if two leaders think they are both holding a lease, they don't interfere with each other." (Conclusion)

## Visuals worth redrawing

None.

## My notes

- The aws.amazon.com URL now redirects to builder.aws.com, which renders
  the article with JavaScript and gave no text to curl or WebFetch. The
  text above was read from the Wayback Machine copy of the aws.amazon.com
  page. No year on the page.
