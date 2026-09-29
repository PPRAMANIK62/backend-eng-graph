---
id: redis-active-active-develop
title: Develop applications with Active-Active databases
author: Redis
url: https://redis.io/docs/latest/operate/rs/databases/active-active/develop/develop-for-aa/
kind: docs
primary: true
---

## Summary

Redis Software's guide to writing apps on Active-Active (multi-primary,
geo-distributed) databases, read when "latest" was v8.0. Redis keeps its
normal commands but backs them with CRDTs and extra metadata. The page
shows counters adding up across sites, argues against plain last-write-
wins, and explains tombstones and the INFO fields for their garbage
collection.

## Key claims

- Active-Active uses multi-master replication plus CRDTs, with the usual Redis commands. "Active-Active databases allow developers to use existing Redis data types and commands, but automatically handle conflicting concurrent writes to the same key across multiple geographies." (intro)
- INCR from two sites adds up. "For example, developers can simply use the INCR or INCRBY method in Redis in all instances of the geo-distributed application, and Active-Active databases handle the additive nature of INCR to reflect the correct final value." (intro)
- The example: INCRBY 7 on one member, INCRBY 3 on the other, each reads its own value (7 and 3) until sync, then both read 10. (intro, table t1 to t5)
- Plain LWW loses non-conflicting updates. "However, LWW can be destructive to updates that are not necessarily conflicting. For example, adding a new element to a set across two geographies concurrently would result in only one of these new elements appearing in the final result with LWW." (intro, list of approaches)
- The types look the same but carry more metadata. "the underlying types in Redis Software are enhanced to maintain more metadata to create the conflict-free data type experience." (intro)
- Deleted keys stay as tombstones. "For conflict resolution purposes, Active-Active databases cannot immediately release a deleted key." (Tombstones)
- A tombstone goes only once every instance has seen the delete. "The garbage collector automatically removes a tombstone when all instances in the Active-Active database have observed the deletion operation." (Tombstones)
- INFO exposes vector clocks and GC counters. "crdt_gc_pending" is listed as "Number of elements pending garbage collection." (INFO table)

## Visuals worth redrawing

- The t1 to t9 table of two members incrementing a counter and syncing.

## My notes

- Sibling pages (read, not cited): strings use last-write-wins with OS time except when used as counters; sets follow OR-Set "add wins" behaviour.
