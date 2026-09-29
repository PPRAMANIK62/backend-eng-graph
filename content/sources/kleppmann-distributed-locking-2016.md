---
id: kleppmann-distributed-locking-2016
title: How to do distributed locking
author: Martin Kleppmann
url: https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html
kind: blog
primary: false
---

## Summary

Kleppmann's 2016 critique of the Redlock algorithm. Before getting to
Redlock, it shows why any lock with a timeout (a lease) is unsafe on its own:
a client can pause, or its request can be delayed, past the lease's expiry
and then write anyway. The fix it proposes is fencing tokens checked by the
storage. Then it argues Redlock gives no fencing tokens and depends on
timing assumptions (bounded delays, pauses and clock error) for safety.

## Key claims

- A distributed lock isn't a mutex, because nodes and the network fail independently. "It's important to remember that a lock in a distributed system is not like a mutex in a multi-threaded application." (Protecting a resource with a lock)
- The broken pattern: acquire lock, read, modify, write, release. A client paused while holding the lease can write after the lease expired. "if the GC pause lasts longer than the lease expiry period, and the client doesn't realise that it has expired, it may go ahead and make some unsafe change." (Protecting a resource with a lock)
- This happened in practice. "This bug is not theoretical: HBase used to have this problem" (Protecting a resource with a lock)
- Stop-the-world GC pauses can last minutes; even "concurrent" collectors stop the world sometimes. "“stop-the-world” GC pauses have sometimes been known to last for several minutes" (Protecting a resource with a lock)
- Checking the lease right before writing doesn't help; the pause can land between the check and the write. "GC can pause a running thread at any point, including the point that is maximally inconvenient for you (between the last check and the write operation)." (Protecting a resource with a lock)
- Other causes of pauses: page faults, network-backed disks like EBS, CPU contention, a stray SIGSTOP. "Maybe someone accidentally sent SIGSTOP to the process." (Protecting a resource with a lock)
- Pauses are a given. "Your processes will get paused." (Protecting a resource with a lock)
- Network delay does the same thing: GitHub saw packets delayed about 90 seconds. "in a famous incident at GitHub, packets were delayed in the network for approximately 90 seconds" (Protecting a resource with a lock)
- The conclusion: you can't assume timing. "You simply cannot make any assumptions about timing, which is why the code above is fundamentally unsafe, no matter what lock service you use." (Protecting a resource with a lock)

- Two reasons to lock: efficiency (a failure costs some duplicate work) or correctness (a failure corrupts data). "At a high level, there are two reasons why you might want a lock in a distributed application: for efficiency or for correctness" (What are you using that lock for?)
- For efficiency locks, a single Redis instance is enough. "You are better off just using a single Redis instance, perhaps with asynchronous replication to a secondary instance in case the primary crashes." (What are you using that lock for?)
- Fencing token definition: a number that rises each time the lock is acquired, sent with every write. "a fencing token is simply a number that increases (e.g. incremented by the lock service) every time a client acquires the lock." (Making the lock safe with fencing)
- The worked example: client 1 gets token 33 and pauses, client 2 gets 34 and writes, storage rejects client 1's late write with 33. "the storage server remembers that it has already processed a write with a higher token number (34), and so it rejects the request with token 33." (Making the lock safe with fencing)
- The storage has to check tokens itself. "Note this requires the storage server to take an active role in checking tokens, and rejecting any writes on which the token has gone backwards." (Making the lock safe with fencing)
- In ZooKeeper, the zxid or znode version can be the token. "you can use the zxid or the znode version number as fencing token" (Making the lock safe with fencing)
- Redlock has no fencing tokens; its random value isn't monotonic. "The unique random value it uses does not provide the required monotonicity." (Making the lock safe with fencing)
- Generating tokens safely probably needs consensus. "It's likely that you would need a consensus algorithm just to generate the fencing tokens." (Making the lock safe with fencing)
- Acquiring a lock is like compare-and-set, which needs consensus. "Acquiring a lock is like a compare-and-set operation, which requires consensus" (Using time to solve consensus)
- Redis expires keys using gettimeofday, which can jump. "Note that Redis uses gettimeofday, not a monotonic clock, to determine the expiry of keys." (Using time to solve consensus)
- Good algorithms keep safety without timing assumptions; only liveness uses timeouts. "Only liveness properties depend on timeouts or some other failure detector." (Using time to solve consensus)
- Redlock's safety depends on timing. "Its safety depends on a lot of timing assumptions" (Using time to solve consensus)
- Clock jump example with nodes A to E: client 1 locks A, B, C; C's clock jumps; client 2 locks C, D, E. "The clock on node C jumps forward, causing the lock to expire." (Breaking Redlock with bad timings)
- GC pause example: responses arrive after the locks expired and client 2 took them. "Clients 1 and 2 now both believe they hold the lock." (Breaking Redlock with bad timings)
- Redlock needs a synchronous model: bounded delay, pauses and clock error. "Redlock assumes that delays, pauses and drift are all small relative to the time-to-live of a lock; if the timing issues become as large as the time-to-live, the algorithm fails." (The synchrony assumptions of Redlock)
- Conclusion: "neither fish nor fowl". "it is unnecessarily heavyweight and expensive for efficiency-optimization locks, but it is not sufficiently safe for situations in which correctness depends on the lock." (Conclusion)
- For correctness, use a consensus system and enforce fencing. "Instead, please use a proper consensus system such as ZooKeeper, probably via one of the Curator recipes that implements a lock." (Conclusion)
- "And please enforce use of fencing tokens on all resource accesses under the lock." (Conclusion)
- A token counter on one Redis node isn't enough. "a counter on one Redis node would not be sufficient, because that node may fail." (Making the lock safe with fencing)
- In the pause example, the successful replies sit in the paused client's kernel buffers. "they were held in client 1’s kernel network buffers while the process was paused" (Breaking Redlock with bad timings)
- Wall clocks can jump, stepped by NTP or an administrator. "clock is manually adjusted by an administrator" (Using time to solve consensus)
- Written while researching his book. "As part of the research for my book, I came across an algorithm called Redlock on the Redis website." (intro)
- He doubts Redlock would pass Jepsen. "It is unlikely that Redlock would survive a Jepsen test." (The synchrony assumptions of Redlock)
- A pause can come from a disk that is really a network. "Maybe your disk is actually EBS, and so reading a variable unwittingly turned into a synchronous network request over Amazon's congested network." (Protecting a resource with a lock)
- Antirez replied the next day; Kleppmann stood by his conclusions. "He makes some good points, but I stand by my conclusions." (Update at the end)

## Visuals worth redrawing

- "Using fencing tokens to make resource access safe": tokens 33 and 34,
  the storage rejecting the late write with 33.
- "Unsafe access to a resource protected by a distributed lock": client 1 gets the lease, pauses for GC, the lease expires, client 2 gets it and writes, client 1 wakes and writes too.

## My notes

- Fencing tokens and the Redlock debate are used in phase 12
  (`fencing-tokens`, `distributed-locks`). Antirez's reply is
  antirez-is-redlock-safe-2016.
