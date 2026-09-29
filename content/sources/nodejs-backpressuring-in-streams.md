---
id: nodejs-backpressuring-in-streams
title: Backpressuring in Streams
author: Node.js project
url: https://nodejs.org/en/learn/modules/backpressuring-in-streams
kind: docs
primary: true
---

## Summary

The Node.js guide to backpressure in streams: what goes wrong when a
fast readable feeds a slow writable, a benchmark with backpressure
turned off, how `write()` returning false and the 'drain' event make the
source pause, and the rules for writing your own streams.

## Key claims

- Definition: data building up behind a buffer. "There is a general problem that occurs during data handling called backpressure and describes a buildup of data behind a buffer during data transfer." (intro)
- Unix pipes and TCP sockets solve the same problem, called flow control there. "Unix pipes and TCP sockets are good examples of this, and are often referred to as flow control." (intro)
- Without backpressure the consumer queues chunks and memory grows. "The write queue will get longer and longer, and because of this more data must be kept in memory until the entire process has been completed." (Too Much Data, Too Quickly)
- Effects: other processes slow, GC overworked, memory exhaustion. (Too Much Data, Too Quickly, list)
- Their experiment: gzip a ~9 GB file with `write()` patched to always return true. Max resident set about 87.81 MB with backpressure, about 1.52 GB without. "The maximum byte size occupied by virtual memory turns out to be approximately 1.52 gb." (Memory Exhaustion)
- Run times were similar (averages 55,299 ms vs 55,975 ms), so the cost showed up as memory and GC, not speed. (Excess Drag on Garbage Collection, table)
- The trigger is `write()` returning false. "The moment that backpressure is triggered can be narrowed exactly to the return value of a Writable's .write() function." (How Does Backpressure Resolve These Issues?)
- It returns false when the buffer passes highWaterMark or the write queue is busy. "In any scenario where the data buffer has exceeded the highWaterMark or the write queue is currently busy, .write() will return false." (How Does Backpressure Resolve These Issues?)
- Then the source pauses until 'drain'. "Once the data buffer is emptied, a 'drain' event will be emitted and resume the incoming data flow." (How Does Backpressure Resolve These Issues?)
- Result: bounded memory per pipe. "This effectively allows a fixed amount of memory to be used at any given time for a .pipe() function." (How Does Backpressure Resolve These Issues?)
- The rules. "Never call .write() after it returns false but wait for 'drain' instead." (Rules to Abide By When Implementing Custom Streams)
- A readable must stop when push() returns false. "If .push() returns a false value, the stream will stop reading from the source." (Rules specific to Readable Streams)
- The common mistake: writing on every 'data' event ignores backpressure. "readable.on('data', data => writable.write(data));" (Rules specific to Readable Streams, counter-example)
- It gives the default highWaterMark as 16 kB. "commonly, the default is set to 16kb (16384, or 16 for objectMode streams)" (How Does Backpressure Resolve These Issues?, note)

## Visuals worth redrawing

- Readable -> write() -> buffer at highWaterMark -> false -> pause ->
  'drain' -> resume, as a loop.

## My notes

- The 16 kB default is out of date: the stream API docs say Node 22
  raised it to 64 KiB on non-Windows (see nodejs-stream-api).
- No author named in the fetched page; credited to the Node.js project.
