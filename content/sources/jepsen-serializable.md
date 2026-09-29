---
id: jepsen-serializable
title: "Serializability"
author: Jepsen
url: https://jepsen.io/consistency/models/serializable
kind: docs
primary: false
---

## Summary

Jepsen's reference page on serializability: the informal meaning, what
it doesn't promise (real time, per-process order), the odd histories it
still allows, and pointers to the formal definitions (ANSI, Adya,
Cerone, Crooks).

## Key claims

- Transactions appear to happen in some total order. "Informally, serializability means that transactions appear to have occurred in some total order." (top)
- It covers the whole system, including predicates. "serializability applies not only to the particular objects involved in a transaction, but to the system as a whole—operations may act on predicates, like “the set of all cats”." (top)
- It can't stay available during a partition. "Serializability cannot be totally or sticky available; in the event of a network partition, some or all nodes will be unable to make progress." (top)
- No real-time guarantee: a later read may miss an earlier completed write. "However, it does not impose any real-time, or even per-process constraints." (top)
- A process can miss its own earlier writes. "In fact, a process can fail to observe its own prior writes, if those writes occurred in different transactions." (top)
- Legal but useless orderings exist. "a serializable database can always return the empty state for any reads, by appearing to execute those reads at time 0." (top)
- The SQL standard's own definition of a serializable execution. "A serializable execution is defined to be an execution of the operations of concurrently executing SQL-transactions that produces the same effect as some serial execution of those same SQL-transactions." (Formally, quoting ANSI SQL 1999)
- Adya's preventive reading of the ANSI levels is too strict. "the preventative interpretation of the ANSI specification is overly restrictive: it rules out some histories which are legally serializable." (Formally)
- Serializability means a transaction's parts don't appear to interleave with others'. "Serializability guarantees that operations take place atomically: a transaction’s sub-operations do not appear to interleave with sub-operations from other transactions." (top)
- For real-time guarantees you need strict serializability. "For those kinds of real-time guarantees, see strict serializable." (top)

## Visuals worth redrawing

None.

## My notes

- No author is named on the page, so the author field says Jepsen.
