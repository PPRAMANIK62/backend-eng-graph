---
id: process-pauses
title: Process pauses
depth: short
phase: 11
note: >-
  A process can freeze for seconds (GC, a VM migration, SIGSTOP) and
  carry on as if no time passed.
needs: [distributed-system, garbage-collection]
leads_to: [fault-injection, leases, fencing-tokens, failure-detection, distributed-locks]
compare_with: [failover]
---

# Process pauses

A process can stop running for a while, then pick up exactly where it left
off, with no idea that time passed. On one machine that's just a latency
spike. In a [[distributed-system|distributed system]] it's a correctness
problem: while one node is frozen the others carry on, may decide it's
dead, and hand its job to someone else. When it wakes up, it acts on
beliefs that stopped being true.

## A lock that expires while you sleep

Say a client needs to update a file in shared storage, and a lock service
makes sure only one client does it at a time. The lock has a timeout, a
lease, so a client that crashes doesn't hold it forever. The code looks
reasonable: take the lock, read the file, change it, write it back,
release the lock.

![Timeline with three lanes. Client 1 is granted the lease by the lock service, then pauses for garbage collection. The lease expires during the pause and the lock service grants it to client 2, which writes to storage. Client 1 then wakes up, still thinking it holds the lease, and writes to storage too.](img/process-pauses-lease.svg)

*A pause longer than the lease. Adapted from Martin Kleppmann, "How to do distributed locking" (2016).*

Client 1 gets the lease, then stops for a garbage collection. The pause
lasts longer than the lease, so the lock service gives the lock to client
2, which writes the file. Then client 1 wakes up, still believing it holds
the lock, and writes too. One of the two updates is lost, or the file is
corrupted. HBase had this bug.

Checking the lease just before writing doesn't fix it. The pause can land
between the check and the write, and from the paused thread's point of
view, no time passed between them.

## Where pauses come from

Garbage collection is the famous cause, but there are many others:

- **[[garbage-collection|Garbage collection]].** Stop-the-world pauses on
  large heaps have lasted several minutes. Even collectors called
  "concurrent" need short stop-the-world phases.
- **[[page-faults|Page faults]].** Touching memory that isn't loaded
  blocks the thread until the page comes in from disk. If the "disk" is
  network storage like Amazon EBS, that's a network request in disguise.
- **CPU contention.** Other processes on the same machine get the CPU
  first.
- **Signals.** Someone sends the process `SIGSTOP` by accident (see
  [[signals]]).
- **Virtual machine migration.** Moving a running VM to another host ends
  with a stop-and-copy step in which the whole guest operating system is
  suspended, every process in it at once. The 2005 Xen work that built live
  migration measured downtimes of 60 ms to 210 ms on its test cluster.

A network can do the same thing to a message: in one GitHub incident,
packets sat in the network for about 90 seconds. A request that left before
the lease expired can arrive long after.

## Where it gets tricky

**A pause isn't a crash.** A crashed process loses its memory and starts
again from what it saved. A paused process keeps everything in memory and carries on
without realising anything happened, so no recovery code runs. That's why
[[failure-models]] treat timing as a question of its own, separate from
crashes.

**Faster collectors don't make the problem go away.** Low-pause garbage
collectors shrink one cause. Page faults, VM migration and a busy host are
still there. The safe assumption is that any process can pause at any
point, for any length of time.

**Clocks don't help the paused process.** Whatever it checks, the pause
can come right after the check. And measuring time across machines is its
own trap; see [[clock-skew]].

## What this means when you build

- Never rely on "I checked, so it's still true" across any gap, however
  short it looks in the code.
- Treat a [[leases|lease]] as a hint about who should act, not proof.
  Make the resource itself reject stale holders, for example with
  [[fencing-tokens]].
- When you test, pause processes on purpose and watch what the rest of
  the cluster does. That's part of
  [[fault-injection]].

## Further reading

- [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html), Martin Kleppmann, 2016. The lease-and-pause example, the list of pause causes, and why timing can't be trusted.
- [Live Migration of Virtual Machines](https://www.usenix.org/legacy/event/nsdi05/tech/full_papers/clark/clark.pdf), Christopher Clark and others, NSDI 2005. How live migration works, and the stop-and-copy step that freezes the whole guest.
