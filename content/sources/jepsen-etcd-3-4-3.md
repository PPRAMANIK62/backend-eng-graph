---
id: jepsen-etcd-3-4-3
title: "Jepsen: etcd 3.4.3"
author: Kyle Kingsbury
url: https://jepsen.io/analyses/etcd-3.4.3
kind: blog
primary: false
---

## Summary

Jepsen's analysis of etcd 3.4.3 (2020). Key-value operations looked strict
serializable under partitions, crashes, pauses, clock skew and membership
changes; locks were unsafe. It also recalls that etcd 0.4.1 (tested in
2014) served stale reads by default, and that etcd 3.0 made linearizable
reads the default, with a serializable flag to opt out.

## Key claims

- etcd 0.4.1 had stale reads by default. "In our 2014 analysis, we found that etcd 0.4.1 exhibited stale reads by default." (intro)
- The cause was local reads on any leader without checking for a newer one. "etcd performed reads on any leader, locally, without checking to see whether a newer leader could have more recent state." (Background)
- etcd 3.0 made linearizability the default except for watches. "in version 3.0 of the etcd API, made linearizability the default for all operations except for watches." (Background)
- The serializable flag allows stale committed reads. "An optional serializable flag downgrades reads from strictly serializable to serializable consistency by allowing reads of stale committed state." (Background)
- Tested with partitions, crashes, pauses, clock skew and membership changes on five-node clusters. "We evaluated etcd version 3.4.3" (Test design)
- Key-value operations appeared strict serializable. "We found that key-value operations appear to be strict serializable" (intro)
- etcd locks are unsafe. "However, etcd locks are fundamentally unsafe" (intro)
- etcd stores a small amount of state, 8 GB by default at most. "etcd stores a small volume of infrequently-updated state (by default, up to 8 GB) in a key-value map" (1 Background)
- Test setup: five-node clusters, partitions, pauses, crashes, clock skew up to hundreds of seconds, membership changes. "We also introduced clock skew up to hundreds of seconds, both for multi-second intervals, and strobing rapidly over milliseconds." (2 Test Design)
- Two clients can hold the same lock even with no faults. "Unfortunately, this is unsafe, because multiple clients may hold the same etcd lock simultaneously." (3.2 Locks Aren't Real)
- Measured loss with locks guarding a read-then-write: two-second lease TTLs, five processes, pauses every five seconds lost about 18% of acknowledged updates. "we could reliably induce the loss of ~18% of acknowledged updates." (3.2)
- The bug: a waiting client whose lease had expired was still told it had the lock. "the server would not re-check to make sure the lease was still valid before informing the client that they now held the lock." (3.2)
- Why locks can't be made safe: a lock service must release a crashed holder's lock to stay live, but can't tell crashed from slow. "mutex violations cannot be eliminated altogether, because distributed locks are a fundamentally unsafe concept in asynchronous systems." (3.2)
- Even a perfect lock can't order messages to another system; an old holder's message can arrive late. "then the message sent by A might arrive (thanks to asynchrony) after process B's message, violating the mutual exclusion property that the lock was intended to provide." (3.2)
- Fix: fencing tokens; in etcd, the lock key's revision. "In etcd, users can use the revision of their lock key as a globally ordered fencing token." (3.2)
- Guarded transactions on etcd itself worked in their tests, but give no atomicity across several operations. "a process could crash or lose its mutex during a multi-operation update, leaving etcd in a logically inconsistent state." (3.2)
- Advice: locks are fine for performance, risky for safety. "It's fine to use etcd locks for performance, but using them for safety might be risky." (4.1 Recommendations)
- The resource should reject lower tokens once a higher one has been used. "The shared resource should ensure that once a client has used a token y to perform some operation, any operations using a lower token x < y must fail." (4.1 Recommendations)
- Fencing doesn't give atomicity, only non-interleaving. "This approach does not ensure atomicity, but it does ensure operations performed under a lock are contiguous, rather than interleaved." (4.1 Recommendations)
- Locks are "dangerously named". "etcd's locks, like all distributed locks, are dangerously named" (4.1 Recommendations)

## Visuals worth redrawing

None.

## My notes

- Useful for linearizable-reads: a real system that shipped stale reads
  and then changed its default.
- Locks (section 3.2, 4.1): the claims about lock safety, the ~18% loss
  test, and fencing with the lock key revision were added for the phase 12
  lock nodes. Issues filed: 11456 (locks return without checking
  ownership) and 11457 (locks not documented as unsafe).
