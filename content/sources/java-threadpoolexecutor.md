---
id: java-threadpoolexecutor
title: ThreadPoolExecutor (Java SE 21 API documentation)
author: Oracle (OpenJDK)
url: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html
kind: docs
primary: true
---

## Summary

The Javadoc for Java's standard thread pool, Java SE 21. Its "Queuing"
and "Rejected tasks" sections are a compact catalogue of what to do with
work when the workers are busy: hand off, queue without bound, queue
with a bound, and four policies for when a bounded queue is full.

## Key claims

- Three queuing strategies: direct handoffs, unbounded queues, bounded queues. "There are three general strategies for queuing:" (Queuing)
- An unbounded queue can grow forever if work keeps arriving faster. "it admits the possibility of unbounded work queue growth when commands continue to arrive on average faster than they can be processed." (Queuing, 2. Unbounded queues)
- A bounded queue prevents resource exhaustion but is harder to tune. "A bounded queue (for example, an ArrayBlockingQueue) helps prevent resource exhaustion when used with finite maximumPoolSizes, but can be more difficult to tune and control." (Queuing, 3. Bounded queues)
- Large queue with small pool: low CPU and context switching, but can mean low throughput. "Using large queues and small pools minimizes CPU usage, OS resources, and context-switching overhead, but can lead to artificially low throughput." (Queuing, 3)
- I/O-bound tasks leave room for more threads. "If tasks frequently block (for example if they are I/O bound), a system may be able to schedule time for more threads than you otherwise allow." (Queuing, 3)
- Small queues need bigger pools and risk scheduling overhead. "Use of small queues generally requires larger pool sizes, which keeps CPUs busier but may encounter unacceptable scheduling overhead, which also decreases throughput." (Queuing, 3)
- Tasks are rejected when both threads and queue are bounded and saturated, or after shutdown. (Rejected tasks)
- Default policy: throw. "In the default ThreadPoolExecutor.AbortPolicy, the handler throws a runtime RejectedExecutionException upon rejection." (Rejected tasks, 1)
- CallerRunsPolicy runs the task on the submitting thread, which slows submitters: built-in backpressure. "This provides a simple feedback control mechanism that will slow down the rate that new tasks are submitted." (Rejected tasks, 2)
- DiscardPolicy drops the new task silently, only for work nobody relies on. "This policy is designed only for those rare cases in which task completion is never relied upon." (Rejected tasks, 3)
- DiscardOldestPolicy drops the head of the queue and retries; rarely acceptable. "This policy is rarely acceptable." (Rejected tasks, 4)
- Pools solve two problems: less overhead per task, and a bound on the threads and other resources used. "Thread pools address two different problems: they usually provide improved performance when executing large numbers of asynchronous tasks, due to reduced per-task invocation overhead, and they provide a means of bounding and managing the resources, including threads, consumed when executing a collection of tasks." (class description)
- Below corePoolSize a new task gets a new thread; above it, the task is queued; a thread beyond core is added only when the queue is full. "Else if fewer than maximumPoolSize threads are running, a new thread will be created to handle the request only if the queue is full." (Core and maximum pool sizes)
- With an unbounded queue the pool never grows past corePoolSize. "Thus, no more than corePoolSize threads will ever be created." (Queuing, 2. Unbounded queues)
- Direct handoff (SynchronousQueue) needs an unbounded maximum and can grow threads without limit. "This in turn admits the possibility of unbounded thread growth when commands continue to arrive on average faster than they can be processed." (Queuing, 1. Direct handoffs)
- Direct handoff is suggested as a good default partly because it avoids lockups between dependent tasks. "This policy avoids lockups when handling sets of requests that might have internal dependencies." (Queuing, 1. Direct handoffs)

## Visuals worth redrawing

None.

## My notes

- Four policies map to reject, block-ish (caller runs), drop newest,
  drop oldest.
