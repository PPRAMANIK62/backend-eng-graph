---
id: distributed-locks
title: Distributed locks
depth: deep
phase: 12
note: >-
  Why locks across machines are hard, and the Redlock argument.
needs: [fencing-tokens, coordination-services, leases, process-pauses]
leads_to: []
compare_with: [leader-election, advisory-locks, linearizability]
---

# Distributed locks

A distributed lock is supposed to make sure that, out of several
processes on different machines, only one does something at a time. It
looks like a [[mutex]] with a network in the middle. It isn't one: the
holder can freeze, its messages can be delayed, and the lock service
can't tell a dead holder from a slow one. This article is about why that
makes every distributed lock weaker than it sounds, how the Redis
"Redlock" algorithm tried to do better, and the argument over whether
it did.

## First ask what the lock is for

There are two reasons to take a lock, and they need very different
tools:

- **Efficiency.** The lock stops two workers doing the same expensive
  job twice. If it fails now and then, you pay for some duplicate work
  or someone gets the same email twice.
- **Correctness.** The lock stops two workers from writing the same data
  at the same time. If it fails, you get a corrupted file or lost
  updates.

For efficiency, almost anything works, including a single Redis server.
For correctness, as the rest of this article shows, the lock alone is
never enough.

## Every distributed lock must expire

A lock across machines has to be released even if its holder crashes,
or one dead process blocks everyone forever. So in practice every
distributed lock is a [[leases|lease]]: it expires unless the holder
keeps renewing it.

That creates the central problem. Once the lease has expired, the lock
service hands it to someone else, but the old holder may still be
running. A long garbage collection pause ([[process-pauses]]), a disk read
that is secretly a network request, or a slow network can all make a holder act after its lease is gone,
without ever noticing. Checking the lease right before acting doesn't
close the gap, because the pause can come between the check and the
act.

This isn't a flaw of one product. It comes from the problem itself: to
stay available, the lock service has to take the lock back from a
holder that stopped answering, and it can't know whether that holder is
dead or just slow. The fix lives at the resource, not in the lock:
[[fencing-tokens]], a number that rises with each new holder and that
the resource checks on every write.

## The simple Redis lock

The most common distributed lock is one Redis key:

```
SET resource_name my_random_value NX PX 30000
```

`NX` means "only if the key doesn't exist", `PX 30000` makes the key
expire after 30 seconds. The value is random and unique to this client
and this attempt. To release, the client deletes the key only if it
still holds its own value: `DELEX key IFEQ my_random_value` since Redis
8.4, a short Lua script before that. A plain `DEL` could delete a lock
that has already expired and been taken by someone else.

This is a fine lock for efficiency. For correctness it has an obvious
weakness: one Redis server. Adding a replica doesn't help, because Redis
replication is asynchronous ([[sync-vs-async-replication]]). A client
takes the lock on the primary, the primary crashes before the key
reaches the replica, the replica is promoted ([[failover]]), and a
second client takes the same lock.

## Redlock: a majority of independent servers

Redlock, designed by Redis's author, spreads the lock over N
independent Redis servers with no replication between them. The docs
use N = 5. To acquire:

1. Read the current time.
2. Try `SET ... NX PX` with the same key and random value on all five
   servers in parallel, with a short timeout per server so a dead one
   doesn't stall you.
3. Read the time again. You hold the lock only if you got it on a
   majority (at least 3) and the time spent is less than the lock's
   time-to-live.
4. The time you can still use is the time-to-live minus the time spent,
   minus an allowance for clock drift.
5. If you failed, release it on all five, even the ones you think you
   didn't get.

![A client sends SET NX PX to five Redis servers, A to E. A, B and C say OK; D and E don't answer. Three of five is a majority, so the client holds the lock. Below, a timeline shows the lock's time-to-live starting at the first request; the time spent acquiring and an allowance for clock drift are subtracted, and what's left is the validity time during which the client may work.](img/distributed-locks-redlock.svg)

*Redlock acquires on a majority of independent servers and trusts the lock only for what's left of its time-to-live. Adapted from the Redis docs, "Distributed Locks with Redis".*

A server that crashes and restarts without the key could let a second
client reach a majority. The docs give two fixes: run Redis with an
fsync on every write ([[redis-persistence]]), which is slow, or keep a
restarted server out of the game for longer than the longest lock's
time-to-live.

## The argument

In 2016 Martin Kleppmann, then writing a book on data systems, published
a critique of Redlock, and Salvatore Sanfilippo (antirez), who designed
it, answered the next day. It's worth following because it's about
what any lock can promise.

**Point one: no fencing tokens.** Redlock's lock value is random, not
increasing, so the resource can't tell an old holder from a new one. A
client that pauses after acquiring can still write after its lock
passed on, whatever the lock algorithm. Kleppmann argued you probably
need [[consensus]] just to generate the numbers, since a counter on one
Redis node dies with the node.

Antirez's reply: every lock with auto-release has the paused-holder
problem, so it's not specific to Redlock. A resource that can reject
lower tokens is already a consistent store, and could hand out the
numbers itself. The random value works too, if the resource can do a
check-and-set against it. And locks are often used exactly where the
resource can't check anything, like calling an external API.

**Point two: safety depends on timing.** Kleppmann argued that good
distributed algorithms stay safe whatever the timing, and only use
clocks to make progress. Redlock is different: it's only safe if
network delays, process pauses and clock errors are all small compared
with the time-to-live. His examples:

- **A clock jump.** Client 1 locks A, B and C; D and E are unreachable.
  C's clock jumps forward and its key expires early. Client 2 locks C,
  D and E. Both hold a majority. Redis expired keys using the wall
  clock (`gettimeofday`), which NTP or an operator can step.
- **A pause during acquisition.** Client 1 sends its requests, then
  freezes. The keys expire everywhere; client 2 takes all five. Client
  1 wakes and reads the successful replies still waiting in its
  kernel's buffers. Both think they hold the lock.

Antirez's reply: Redlock doesn't need synchronized clocks, only that
processes count elapsed time at roughly the same rate, say 5 seconds
with at most 10% error. He agreed Redis should switch to a monotonic
clock. And the pause example is caught by step 3: the client reads the
clock after acquiring, so any delay during acquisition shows up as
elapsed time and the lock counts as invalid. A pause after that step is
the general problem from point one again.

Kleppmann's conclusion: Redlock is too heavy for efficiency locks and
not safe enough for correctness locks. Use a single Redis for the
first, and a consensus system plus fencing for the second. Antirez
didn't accept the conclusion. Kleppmann doubted Redlock
would survive a Jepsen test; antirez asked for exactly that kind of
testing.

## What happened next

Today the Redis docs for Redlock end with a disclaimer that points to
both posts, tells you to implement fencing tokens for any distributed
lock, and says Redis still doesn't use a monotonic clock for key
expiry, so a wall-clock jump can let two processes hold one lock.

Consensus-based locks turned out to share the paused-holder problem.
Jepsen tested etcd 3.4.3 in 2020. etcd's key-value operations held up
under partitions, pauses and clock skew. Its locks did not: two clients
could hold the same lock even in a healthy cluster. Using etcd locks to
guard a read-then-write on an outside data set, with two-second lease
TTLs, five processes and a pause every five seconds, lost about 18% of
acknowledged updates. A bug made it worse (a client waiting on a lock
wasn't re-checked for an expired lease), but fixing it couldn't make
locks safe. The report's recommendation is the same as Kleppmann's:
use the lock key's revision as a fencing token.

## Locks from a coordination service

With a [[coordination-services|coordination service]], the lock comes
with the pieces you need:

- **ZooKeeper**: each waiter creates a sequential, ephemeral node under
  the lock's path. The lowest number holds the lock; each waiter
  watches only the node just before its own, so a release wakes one
  process. If a holder's session dies, its node vanishes and the next
  in line gets the lock. The node's version or zxid is the fencing
  token.
- **etcd**: lock calls built on leases, and the lock key's revision as
  the token. A write to etcd itself can be guarded by the lock in the
  same transaction.
- **Chubby**: locks are advisory, and a holder can ask for a
  *sequencer* (lock name, mode, generation number) to pass to servers,
  which check it. For servers that can't, Chubby holds a lock back for
  a *lock-delay* (up to a minute) after a holder fails, so late requests
  have time to drain. Its authors call this imperfect.

The service gives you a well-tested lease and a trustworthy number. It
still doesn't give you mutual exclusion at the resource.

## Where it gets tricky

**"Lock" is the wrong word.** Jepsen calls distributed locks
"dangerously named". A mutex in one process really does stop the other
thread. A distributed lock only tells you who held it when you asked.
Postgres [[advisory-locks]] have the same limit when you use them to
coordinate work outside the database.

**Fencing needs a resource that cooperates.** It works when the thing
you write to can store a number and reject older ones: a database row,
etcd itself, a storage service you control. It doesn't work for a
third-party API or anything physical. There you don't have mutual
exclusion, whichever lock you pick, and the honest fix is to make the
work safe to repeat ([[idempotency]]).

**Fencing isn't atomicity.** A fenced-off holder's first few writes
still happened. If the work is several steps, a new holder may find it
half done.

**Token order isn't action order.** Antirez's point: tokens record the
order clients got the lock, not the order their writes arrive. Fencing
handles this by rejecting the late, lower one, not by ordering them.

**Coarse locks are the easy case.** Chubby was built for locks held for
hours or days, such as electing a primary. Taking a distributed lock
per request puts the lock service on every request's path, and makes
every failure of it everyone's problem.

## What this means when you build

- Decide first: efficiency or correctness. For efficiency, one Redis
  key with `SET NX PX` and a compare-and-delete release is enough; say
  in the code that it's approximate.
- For correctness, don't rely on the lock. Make the resource check a
  fencing token, or skip the lock and use the resource's own
  concurrency control: a transaction, a conditional write,
  [[optimistic-concurrency]].
- If you need a lock service, use a coordination service's lock recipe
  and pass its revision or sequence number with every write.
- If you can't fence and can't make the work idempotent, you can't make
  it safe with a lock either. Know which case you're in.
- Electing a long-lived leader is the same problem with a longer lease:
  see [[leader-election]].

## Further reading

- [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html), Martin Kleppmann, 2016. Efficiency vs correctness locks, fencing tokens, and the case against Redlock.
- [Is Redlock safe?](http://antirez.com/news/101), Salvatore Sanfilippo, 2016. The designer's reply: auto-release, random tokens with check-and-set, and Redlock's timing model.
- [Distributed Locks with Redis](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/), Redis docs (Redis 8.4 era). The single-instance lock, the Redlock algorithm, delayed restarts vs fsync, and the current disclaimer.
- [etcd 3.4.3](https://jepsen.io/analyses/etcd-3.4.3), Kyle Kingsbury (Jepsen), 2020. A test showing consensus-backed locks losing updates, and why no lock can promise mutual exclusion.
- [ZooKeeper: Wait-free coordination for Internet-scale systems](https://www.usenix.org/legacy/event/atc10/tech/full_papers/Hunt.pdf), Patrick Hunt, Mahadev Konar, Flavio P. Junqueira, Benjamin Reed, USENIX ATC 2010. The lock built from sequential, ephemeral nodes without a herd effect.
- [The Chubby lock service for loosely-coupled distributed systems](https://research.google.com/archive/chubby-osdi06.pdf), Mike Burrows, OSDI 2006. Advisory locks, sequencers, lock-delay, and why coarse-grained locks.
