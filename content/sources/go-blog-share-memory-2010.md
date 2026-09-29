---
id: go-blog-share-memory-2010
title: Share Memory By Communicating
author: Andrew Gerrand
url: https://go.dev/blog/codelab-share
kind: blog
primary: true
---

## Summary

A short Go blog post (2010) on Go's approach: instead of guarding
shared data with locks, pass references to it over channels so only one
goroutine has it at a time. Compares a lock-based URL poller with a
channel-based one.

## Key claims

- The traditional model: threads share memory, guarded by locks. "Typically, shared data structures are protected by locks, and threads will contend over those locks to access the data." (para 1)
- Go's idea comes from Hoare's CSP. "These concepts have an interesting history that begins with C. A. R. Hoare’s Communicating Sequential Processes." (para 2)
- Pass references over channels so one goroutine has the data at a time. "Instead of explicitly using locks to mediate access to shared data, Go encourages the use of channels to pass references to data between goroutines. This approach ensures that only one goroutine has access to the data at a given time." (para 2)
- The slogan, from Effective Go. "Do not communicate by sharing memory; instead, share memory by communicating." (para 2)
- The lock-based poller needs a polling flag and lastPolled bookkeeping inside the shared structure, under a mutex; the channel version is a loop that receives from an in channel and sends to an out channel. (examples)

## Visuals worth redrawing

- The poller: a pool of goroutines between an "in" channel and an "out"
  channel, each resource owned by whoever holds it.

## My notes

- Ownership is by convention: nothing stops the sender from touching
  the data after sending it. Not stated in the post; it's my reading,
  so it's not an article fact unless a source says it.
