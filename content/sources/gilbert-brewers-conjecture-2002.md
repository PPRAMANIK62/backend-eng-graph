---
id: gilbert-brewers-conjecture-2002
title: "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services"
author: Seth Gilbert, Nancy Lynch
url: https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf
kind: paper
primary: true
---

## Summary

The proof of Brewer's conjecture (ACM SIGACT News, 2002), which made it
the CAP theorem. Defines consistency as an atomic (linearizable)
read/write object, availability as every request to a non-failing node
getting a response, and partition tolerance as the network losing
arbitrarily many messages, then proves you can't have all three, in
asynchronous and in partially synchronous networks.

## Key claims

- The conjecture, from Brewer's PODC 2000 talk. "At PODC 2000, Brewer1 , in an invited talk [2], made the following conjecture: it is impossible for a web service to provide the following three guarantees:" (1)
- Consistency is modelled as an atomic (linearizable) data object. "The most natural way of formalizing the idea of a consistent service is as an atomic data object." (2.1)
- Atomic: one total order, each operation at a single instant. "Under this consistency guarantee, there must exist a total order on all operations such that each operation looks as if it were completed at a single instant." (2.1)
- A read after a completed write must see it. "One important property of an atomic read/write shared memory is that any read operation that begins after a write operation completes must return that value, or the result of a later write operation." (2.1)
- Availability. "For a distributed system to be continuously available, every request received by a non-failing node in the system must result in a response." (2.2)
- No bound on how long the response takes. "In some ways this is a weak definition of availability: it puts no bound on how long the algorithm may run before terminating, and therefore allows unbounded computation." (2.2)
- Partition tolerance: the network may lose any number of messages. "In order to model partition tolerance, the network will be allowed to lose arbitrarily many messages sent from one node to another." (2.3)
- Atomic consistency here is not ACID. "Discussing atomic consistency is somewhat different than talking about an ACID database, as database consistency refers to transactions, while atomic consistency refers only to a property of a single request/response operation sequence." (footnote 3)
- Brewer asked for almost all requests; the proof asks for all. "Brewer originally only required almost all requests to receive a response." (footnote 4)
- The asynchronous model has no clock. "In the asynchronous model, there is no clock, and nodes must make decisions based only on the messages received and local computation." (3.1)
- The idea of the proof. "The basic idea of the proof is to assume that all messages between G1 and G2 are lost." (3.1)
- Even with no messages lost, a node can't tell lost from slow. "The main idea is that in the asynchronous model an algorithm has no way of determining whether a message has been lost, or has been arbitrarily delayed in the transmission channel." (3.1, Corollary 1.1)
- Any two of the three are possible. "While it is impossible to provide all three properties: atomicity, availability, and partition tolerance, any two of these three properties can be achieved." (3.2)
- CP example: a central node, which stops answering when messages are lost. "A simple centralized algorithm meets these requirements: a single designated node maintains the value of an object." (3.2.1)
- Quorum and locking systems are of that kind. "Many distributed databases provide this type of guarantee, especially algorithms based on distributed locking or quorums" (3.2.1)
- AP example: web caches. "Web caches are one example of a weakly consistent network." (3.2.3)
- Clocks don't save you. "It is still impossible to have an always available, atomic data object when arbitrary messages may be lost, even in the partially synchronous model." (4.2)
- Who Brewer was at the time. "Eric Brewer is a professor at the University of California, Berkeley, and the co-founder and Chief Scientist of Inktomi." (footnote 1)

## Visuals worth redrawing

- The proof itself makes a good figure: two groups G1 and G2, a write
  that completes in G1, a later read in G2, no messages between them.

## My notes

- The note's author footnote calls Brewer co-founder and Chief Scientist
  of Inktomi at the time.
