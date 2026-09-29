---
id: fencing-tokens
title: Fencing tokens
depth: short
phase: 12
note: >-
  A number that rises with every new lock holder, so an old holder can
  be refused.
needs: [leases, process-pauses]
leads_to: [leader-election, distributed-locks, realtime-sync]
compare_with: [advisory-locks, optimistic-concurrency, split-brain]
---

# Fencing tokens

A fencing token is a number the lock service hands out with every lock,
one higher each time the lock changes hands. The holder sends it along
with every write, and the thing being written to refuses any number
lower than the highest it has already seen. It's what stops a lock
holder that lost its lock without noticing from doing damage, and
without it a lock across machines can't guarantee much.

## The holder that didn't know it lost the lock

A lock across machines is a [[leases|lease]]: it expires if the holder
stops renewing, so a crashed holder can't block everyone forever. The
catch is the holder that isn't dead, just stalled.

Say two workers take turns writing a file in shared storage, guarded by
a lock:

1. Client 1 gets the lock and prepares its write.
2. Client 1 freezes, maybe for a long garbage collection pause
   ([[process-pauses]]). Its lease runs out while it's frozen.
3. Client 2 gets the lock and writes.
4. Client 1 wakes up. From its point of view no time has passed, so it
   still thinks it holds the lock, and it writes too. Client 2's work is
   overwritten.

Checking the lease right before the write doesn't fix this. The pause
can land between the check and the write. The same thing happens without
any pause if client 1's write was sent in time but spent a long while
in the network: it can arrive after the lock has passed to someone else.

## Numbering the lock holders

Now give each acquisition a number:

![Timeline with a lock service, client 1, client 2 and storage. Client 1 gets the lease with token 33, then pauses for a long time and its lease expires. Client 2 gets the lease with token 34 and writes with token 34; storage accepts it. Client 1 wakes and writes with token 33; storage rejects it because it has already seen 34.](img/fencing-tokens-sequence.svg)

*The storage remembers the highest token it has accepted and rejects anything lower. Adapted from Martin Kleppmann, "How to do distributed locking" (2016).*

Client 1 got token 33. Client 2 got 34 and wrote with it, so the
storage now remembers 34. When client 1's late write arrives with 33,
the storage rejects it. The paused client can't hurt anything, whatever
it believes about its lock.

Two things make this work:

- **The number must only go up**, strictly, with every new holder. That
  needs the lock service itself to be consistent, which in practice
  means built on consensus.
- **The resource must check it.** The storage keeps the highest token it
  has accepted and refuses lower ones, and the check and the write have
  to happen as one step there.

## Where the numbers come from

You rarely invent the counter. Coordination services already have one:

- **Chubby** calls it a sequencer: a string with the lock's name, its
  mode and a generation number that rises with each acquisition. A
  server receiving one can check it against the most recent sequencer it
  has seen. Before sequencers, the Chubby paper describes the bare
  version: pass the lock acquisition count with each write and add one
  `if` to the file server to reject lower counts.
- **ZooKeeper**: the zxid of the lock's znode, or the znode's version.
- **etcd**: the revision of your lock key, which is ordered across the
  whole store.

A random unique value per lock doesn't work as a fencing token, because
it can't tell the storage which holder is newer. That's one of the
central points in the argument over Redlock ([[distributed-locks]]).

## Where it gets tricky

**The resource has to cooperate.** Fencing only helps if the thing you
write to can store a number and compare it. Many resources can't, such
as someone else's API that you call while holding the lock. Chubby offered a weaker fallback
for servers that couldn't check sequencers, the lock-delay: when a
holder fails without releasing, nobody can take the lock for a while
(up to a minute). Its own authors call it imperfect.

**Fencing isn't atomicity.** It stops an old holder's writes from being
mixed in with a new holder's. It doesn't undo half of a multi-step
update the old holder managed before it was fenced off. If client 1
wrote two of five records before client 2 took over, those two stay.

**Every resource keeps its own high-water mark.** If the lock guards
several stores, each has to track and check the token itself.

## What this means when you build

- If duplicate work under a lock would corrupt data, fence it. Pass the
  token with every write and have the resource reject lower ones.
- The cheapest version is a column: store the token next to the data
  and make the write conditional on it, the same move as
  [[optimistic-concurrency]].
- Take tokens from a consensus-backed service ([[coordination-services]]),
  not from a counter on one node.
- If the resource can't check a token, you don't have mutual exclusion.
  Design the work to be safe to repeat instead ([[idempotency]]).

## Further reading

- [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html), Martin Kleppmann, 2016. The paused-client problem and fencing tokens, with the diagram this article redraws.
- [The Chubby lock service for loosely-coupled distributed systems](https://research.google.com/archive/chubby-osdi06.pdf), Mike Burrows, OSDI 2006. Sequencers and lock-delay, fencing in a real lock service.
- [etcd 3.4.3](https://jepsen.io/analyses/etcd-3.4.3), Kyle Kingsbury (Jepsen), 2020. Using the etcd lock key's revision as a token, and why fencing doesn't give atomicity.
