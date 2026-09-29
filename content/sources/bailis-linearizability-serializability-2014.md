---
id: bailis-linearizability-serializability-2014
title: "Linearizability versus Serializability"
author: Peter Bailis
url: http://www.bailis.org/blog/linearizability-versus-serializability/
kind: blog
primary: false
---

## Summary

A short post separating the two words: linearizability is about single
operations on single objects in real time; serializability is about
transactions over many objects in some order, not necessarily real
time. Strict serializability is both.

## Key claims

- Serializability is about groups of operations over many objects. "Serializability is a guarantee about transactions, or groups of one or more operations over one or more objects." (Serializability)
- It is the classic I in ACID. "Serializability is the traditional “I,” or isolation, in ACID." (Serializability)
- It says nothing about real time. "Unlike linearizability, serializability does not—by itself—impose any real-time constraints on the ordering of transactions." (Serializability)
- It doesn't fix which order, only that one exists. "Serializability does not imply any kind of deterministic order—it simply requires that some equivalent serial execution exists." (Serializability)
- Strict serializability adds real-time order. "Combining serializability and linearizability yields strict serializability" (Strict Serializability)
- Linearizability is single-operation, single-object, real-time. "Linearizability is a guarantee about single operations on single objects." (Linearizability)
- Two-phase locking actually gives strict serializability; some MVCC implementations don't. "Note that some implementations of serializability (such as two-phase locking with long write locks and long read locks) actually provide strict serializability." (note 2)
- A silly but legal serializable system: answer every read-only transaction with nothing. "returning NULL in response to every read-only transaction is serializable (provided we start with an empty database) but rather unhelpful." (note 3)
- The terms come from two communities, which is part of the confusion. "linearizability hails from the distributed systems and concurrent programming communities, and serializability comes from the database community." (A note on terminology)

## Visuals worth redrawing

None.

## My notes

None.
