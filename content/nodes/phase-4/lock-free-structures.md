---
id: lock-free-structures
title: Lock-free data structures
depth: short
phase: 4
note: >-
  Data structures built on atomic compare-and-swap instead of locks, and
  their traps.
needs: [memory-model, atomics]
leads_to: []
compare_with: [mutex]
---

# Lock-free data structures

A lock-free data structure lets many [[thread|threads]] use it at once without a
[[mutex]]. Instead of locking, each operation prepares its change
privately and publishes it with one [[atomics|atomic instruction]], usually
compare-and-swap. The payoff is that a thread that stalls halfway can't
hold up the others. The cost is a set of traps that make these
structures famously hard to get right.

## Compare-and-swap in a loop

Compare-and-swap (CAS) takes an address, the value you expect to find
there, and a new value. If the address still holds the expected value,
it writes the new one and reports success, all as one indivisible step.
If not, it changes nothing and reports failure. In Go it's
`atomic.CompareAndSwapPointer` and friends.

Pushing onto a shared stack (a linked list with a `top` pointer) looks
like this:

```text
loop:
    old = top               // copy the shared pointer
    node.next = old         // private work, nobody sees it yet
    if CAS(top, old, node)  // publish, only if top hasn't moved
        return
    // someone else changed top: try again
```

The pattern is always the same: copy the shared value, do the work on
the side, and publish with CAS. A failed CAS means some other thread's
CAS succeeded, so the structure as a whole always makes progress, even
if one thread retries.

## What "lock-free" promises

Lock-free is a promise about progress, not a claim that there are no
mutexes. The usual definition: however the threads are scheduled, some
operation keeps completing. If you pause one thread forever in the
middle of an operation, the others still finish theirs. A mutex can't
promise that: pause the thread holding it, and everyone waits.

That's why these structures exist. A thread holding a lock can be
delayed by the scheduler preempting it, by a [[page-faults|page fault]]
or by a [[cpu-cache|cache]] miss, and every thread waiting for the lock is delayed with it.

Code with no mutex isn't automatically lock-free. Two threads running
`while x == 0 { x = 1 - x }` on a shared `x` can flip it back and forth
forever, and neither leaves the loop. Wait-free is the stronger
promise: every thread, not just some thread, finishes in a bounded
number of steps.

The best-known example is the Michael-Scott queue (1996), a linked-list
FIFO queue that enqueues and dequeues with CAS.

## Where it gets tricky

**ABA.** CAS checks that a value is the same, not that nothing
happened. Suppose thread 1 is popping from the stack: it reads `top =
A` and `A.next = B`, and plans `CAS(top, A, B)`. Before it runs,
thread 2 pops A, pops B, and pushes A back. `top` is A again, so thread
1's CAS succeeds and sets `top` to B, a node that's no longer on the
stack.

![Three steps on a stack. First, the stack is A, B, C and thread 1 reads top = A and A.next = B, then pauses. Second, thread 2 pops A and B and pushes A back, leaving A then C, with B removed. Third, thread 1 resumes; top is still A, so its CAS succeeds and sets top to B, which was removed, and C is lost from the stack.](img/lock-free-structures-aba.svg)

*The ABA problem on a lock-free stack.*

The usual fix is a counter stored next to the pointer, bumped on every
successful CAS, so "A again" looks different from "A". It makes ABA
extremely unlikely rather than impossible, and it needs either a CAS
on two words at once or array indices instead of pointers.

**Freeing memory.** When can you free a node you removed? Another
thread may have read a pointer to it a moment ago and still be about
to use it. Getting this wrong has broken published algorithms: the
Michael-Scott paper found races in earlier lock-free queues that could
lose items for good, and showed one memory-management scheme running
out of memory on a queue of 12 items.

**Memory ordering.** CAS makes one location safe. The node's contents
also have to be visible to the thread that pops it. That depends on the
atomics' ordering guarantees ([[memory-model]]). Lock-free code has
often been written to work on x86 and then failed on other processors.
Go makes this part easier: all of its atomics are sequentially
consistent.

**Not always faster.** When many threads CAS the same address, their
operations line up one at a time anyway. The Michael-Scott paper itself
notes that for a queue usually used by only one or two processors, a
single lock runs a little faster.

## What this means when you build

- Use lock-free structures others have tested, not your own. Go's
  `sync/atomic` docs say these operations need great care and that
  channels or the `sync` package are better for most code.
- A single atomic counter or flag is the easy case. A lock-free linked
  structure brings ABA and memory reclamation with it.
- If you do write one, test it with the [[race-detector]], under heavy
  contention, and on ARM as well as x86.
- Measure against a plain mutex before you commit.

## Further reading

- [An Introduction to Lock-Free Programming](https://preshing.com/20120612/an-introduction-to-lock-free-programming/), Jeff Preshing, 2012. What lock-free means, CAS loops, ABA and memory ordering, in plain terms.
- [Simple, Fast, and Practical Non-Blocking and Blocking Concurrent Queue Algorithms](https://www.cs.rochester.edu/u/scott/papers/1996_PODC_queues.pdf), Maged Michael and Michael Scott, 1996. The classic lock-free queue, with ABA and memory reclamation explained.
- [sync/atomic package documentation](https://pkg.go.dev/sync/atomic), The Go Authors, go1.27. Go's compare-and-swap and its memory-model guarantees.
