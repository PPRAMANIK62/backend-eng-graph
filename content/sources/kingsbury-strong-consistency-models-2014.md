---
id: kingsbury-strong-consistency-models-2014
title: "Strong consistency models"
author: Kyle Kingsbury
url: https://aphyr.com/posts/313-strong-consistency-models
kind: blog
primary: false
---

## Summary

Kingsbury's (Jepsen) tour of the strong consistency models, built from
a single register: why operations that take time force you to relax
"read the latest write", how linearizability bounds each operation
between its start and end, and what sequential, causal and serializable
consistency allow instead. Ends with what CAP really says and why
systems mix models.

## Key claims

- A consistency model is the set of allowed histories. "More formally, we say that a consistency model is the set of all allowed histories of operations." (Correctness)
- A register: a variable with one value. "We call this kind of system–a variable with a single value–a register." (Correctness)
- Operations take time because messages take time. "This means our operations are no longer instantaneous." (Light cones)
- An operation can't take effect before it starts. "An operation cannot take effect before its invocation." (Linearizability)
- Or after it ends. "Likewise, the message informing the process that its operation completed cannot travel back in time, which means that no operation may take effect after its completion." (Linearizability)
- So each operation takes effect at one point in its window. "We know that each operation appears to take effect atomically at some point between its invocation and completion." (Linearizability)
- The single state can be many machines, as long as it looks like one. "The “single global state” doesn’t have to be a single node; nor do operations actually have to be atomic." (Linearizability)
- Once an operation completes, everyone sees it or something later. "Once an operation is complete, everyone must see it–or some later state." (Linearizability)
- Compare-and-set on a linearizable register builds other structures. "We can use compare-and-set as the basis for mutexes, semaphores, channels, counters, lists, sets, maps, trees–all kinds of shared data structures become available." (Linearizability)
- It rules out stale and non-monotonic reads. "Hence, linearizability prohibits stale reads." (Linearizability)
- And non-monotonic reads. "It also prohibits non-monotonic reads–in which one reads a new value, then an old one." (Linearizability)
- Sequential consistency lets operations move in time but keeps each process's order. "If we allow processes to skew in time, such that their operations can take effect before invocation, or after completion–but retain the constraint that operations from any given process must take place in that process’ order–we get a weaker flavor of consistency: sequential consistency." (Sequential consistency)
- Causal: a database can hold back an operation until its dependencies are visible. "If we encode those causal relationships like “I depend on operation X” as an explicit part of each operation, the database can delay making operations visible until it has all the operation’s dependencies." (Causal consistency)
- Causal: a reply is visible only after the post it replies to. "insist that any reply be visible to a process only after the post it replies to is visible." (Causal consistency)
- Operations with no causal link have no ordering promise. "operations from the same process with independent causal chains could execute in any relative order" (Causal consistency)
- Serializability alone has no time bound. "If we say that the history of operations is equivalent to one that took place in some single atomic order–but say nothing about the invocation and completion times–we obtain a consistency model known as serializability." (Serializable consistency)
- Order costs coordination. "Speaking loosely, the more histories we exclude, the more careful and communicative the participants in a system must be." (Consistency comes with costs)
- In CAP, consistency means a linearizable register. "Consistency means linearizability, and in particular, a linearizable register." (Consistency comes with costs)
- In CAP, availability means every request to a non-failing node completes. "Availability means that every request to a non-failing node must complete successfully." (Consistency comes with costs)
- You can't choose CA on a real network. "If your network is not perfectly reliable–and it isn’t–you cannot choose CA." (Consistency comes with costs)
- Weakening to sequential or serializable doesn't escape: other proofs cover those. "The problem is that we have other proofs which tell us that you cannot build totally available systems with sequential, serializable, repeatable read, snapshot isolation, or cursor stability–or any models stronger than those." (Consistency comes with costs)
- Sticky clients get causal, PRAM and read-your-writes. "If we relax our notion of availability, such that client nodes must always talk to the same server, some types of consistency become achievable." (Consistency comes with costs)
- A lock service needs linearizability. "If we want to build a distributed lock service, for instance, linearizability is required; without hard time boundaries, we could hold a lock from the future or from the past." (A hybrid approach)
- Modern CPUs aren't linearizable by default. "This is why modern CPU memory models are not linearizable by default–unless you explicitly say so, modern CPUs will reorder memory operations relative to other cores, or worse." (A hybrid approach)
- Mix stores: bulk data in a weak store, a pointer in a linearizable one. "You can write huge volumes of data to S3, Riak or Cassandra, for instance, then write a pointer to that data, linearizably, to Postgres, Zookeeper or Etcd." (A hybrid approach)
- A reader's comment disputes the map: by the classic definitions, this kind of causal consistency can't be stronger than PRAM. "it cannot in fact be stronger than PRAM consistency as your figure suggests." (comments, Aurojit Panda)

## Visuals worth redrawing

- The light-cone and "finite concurrency bounds" diagrams: an operation
  as a window from invocation to completion, with the point where it
  takes effect somewhere inside.

## My notes

- Written in 2014. The comments point out a real disagreement: whether
  causal is stronger than PRAM depends on the definition of causality
  used. The Jepsen map says causal implies PRAM.
