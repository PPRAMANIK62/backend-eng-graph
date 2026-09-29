---
id: kleppmann-dual-writes-2015
title: "Using logs to build a solid data infrastructure (or: why dual writes are a bad idea)"
author: Martin Kleppmann
url: https://www.confluent.io/blog/using-logs-to-build-a-solid-data-infrastructure-or-why-dual-writes-are-a-bad-idea/
kind: talk
primary: false
---

## Summary

Edited transcript of a Craft Conference 2015 talk. Explains why an
application that writes the same data to several stores (database,
cache, search index) ends up with stores that disagree, through race
conditions and partial failures, and proposes a single ordered log that
every store consumes instead, or change data capture from one database.

## Key claims

- Dual writes: the application code updates every store itself. "it’s your application code’s responsibility to update data in all the right places." (Dual writes)
- It's popular because it's easy and seems to work. "The dual writes approach is popular because it’s easy to build, and it more or less works at first." (Dual writes)
- Race: two clients write X=A and X=B to two stores; the writes reach the stores in different orders, so one store ends with B and the other with A. "Now the two datastores are inconsistent with each other, and they will permanently remain inconsistent until sometime later someone comes and overwrites X again." (Race condition with dual writes)
- No error is raised, so nobody notices. "you probably won’t even notice that your database and your search indexes have gone out of sync, because no errors occurred." (Race condition with dual writes)
- Partial failure: the inbox insert succeeds and the unread-counter increment fails, leaving the data inconsistent. "the message has been added to the inbox, but the counter hasn’t been updated." (Updating denormalized data)
- A transaction fixes this inside one database, but not across two stores. "if you keep your emails in a database but your unread counters in Redis – then you lose the ability to tie the writes together into a single transaction." (Updating denormalized data)
- Distributed transactions (2PC) are often unsupported and of doubtful value. "many datastores nowadays don’t support it, and even if they did, it’s not clear whether distributed transactions are a good idea in the first place." (Updating denormalized data)
- The result is permanent inconsistency, not eventual consistency. "What I’m talking about here is permanent inconsistency" (Stop doing dual writes!)
- Alternative: append writes to one log and have every store consume it in order; the log fixes the order, so the race is gone. "The log guarantees that the consumers all see the records in the same order; by applying the writes in the same order, the problem of race conditions is gone." (Instead, embrace the log)
- Each consumer tracks its position and resumes after an outage. "each consumer keeps track of the log position up to which it has processed the log." (Instead, embrace the log)
- Consumers of the log are eventually consistent, so no read-your-writes. "they are eventually consistent." (Instead, embrace the log)
- Change data capture from a single database works as well as writing to the log directly. "As long as you’re only writing to a single database (not doing dual writes), and getting the log of writes from the database (in the order in which they were committed to the DB), then this approach works just as well as making your writes to the log directly." (Using change data capture)
- Going through a database keeps synchronous reads and constraints. "you can use it to make reads that require “immediate consistency” (linearizability), and enforce constraints" (Using change data capture)

## Visuals worth redrawing

- "Race condition with dual writes": two clients, two stores, time left to right, stores end with different values. The main dual-writes picture.
- "Update of denormalized data fails": insert succeeds, counter update fails.

## My notes

- Kleppmann is a researcher and author, not the builder of the systems he
  describes here (he did build Bottled Water), so primary: false.
