---
id: antirez-is-redlock-safe-2016
title: Is Redlock safe?
author: Salvatore Sanfilippo (antirez)
url: http://antirez.com/news/101
kind: blog
primary: true
---

## Summary

Redis's creator, who designed Redlock, replying to Kleppmann's 2016
critique the day after it appeared. He argues that any lock needs
auto-release (so every lock has the paused-holder problem), that
fencing tokens assume a resource that can check them, that a random
unique token can do check-and-set instead, and that Redlock only
assumes processes can count elapsed time with bounded error, not
synchronized clocks or bounded network delay. He agrees Redis should
move to a monotonic clock.

## Key claims

- Written the day after Kleppmann's post. "Martin Kleppmann, a distributed systems researcher, yesterday published an analysis of Redlock" (intro)
- Redlock's goal was to move people off single-instance or failover setups. "The algorithm's goal was to move away people that were using a single Redis instance, or a master-slave setup with failover, in order to implement distributed locks, to something much more reliable and safe" (intro)
- A lock without auto-release is useless, because a crashed holder blocks everyone forever. "A distributed lock without an auto release mechanism, where the lock owner will hold it indefinitely, is basically useless." (Distributed locks, auto release, and tokens)
- After expiry the mutual exclusion guarantee is gone. "After the expire time, the mutual exclusion guarantee, which is the *main* property of the lock, is gone: another client may already have the lock." (Distributed locks, auto release, and tokens)
- Locks are useful exactly where there's no other control on the resource. "Distributed locks are very useful exactly when we have no other control in the shared resource." (point 1)
- A store that can reject lower tokens is linearizable, and could hand out the IDs itself. "If your data store can always accept the write only if your token is greater than all the past tokens, than it's a linearizable store." (point 2)
- A random unique token lets you do check-and-set on the resource instead. "For example you can implement Check and Set." (point 3)
- Token order needn't match the order clients act in. "the order in which the token was acquired, does not necessarily respects the order in which the clients will attempt to work on the shared resource" (point 4)
- Many locks guard things that aren't transactional at all (physical objects, external APIs). "Sometimes we use distributed locks to move physical objects, for example." (point 5)
- Redlock's model: processes count elapsed time at about the same rate, with bounded error; no bound on absolute clock error. "What they need to do is just, for example, to be able to count 5 seconds with a maximum of 10% error." (Let's talk about system models)
- He concedes the monotonic clock point. "However I think Martin is right that Redis and Redlock implementations should switch to the monotonic time API provided by most operating systems" (Let's talk about system models)
- Delays during acquisition are caught by reading the clock before and after; only a delay after the check is a problem, and that one is shared by every lock with expiry. "Note that whatever happens between 1 and 3, you can add the network delays you want, the lock will always be considered not valid if too much time elapsed" (Network delays & co)
- Checking remaining time after acquiring should be common practice for any lock with expiry. "the steps to check the time before/after the lock is acquired, to see how much time is left, should actually be common practice even when using other systems implementing locks with an expiry." (Digression about network delays)
- Delayed restarts avoid fsync, and allow hundreds of thousands of locks per second. "This means it's possible to process hundreds of thousands locks per second with a few Redis instances, which is something impossible to obtain with other systems." (Fsync or not?)
- He asks for Jepsen-style testing to settle it. "It would be great to both receive more feedbacks from experts and to test the algorithm with Jepsen, or similar tools, to accumulate more data." (Conclusions)

## Visuals worth redrawing

None.

## My notes

- The reply doesn't address Kleppmann's clock-jump-on-one-node example
  beyond "don't step the clock" and "use monotonic time".
- The throughput figure ("hundreds of thousands locks per second") is his
  claim, not a published benchmark.
