---
id: nodejs-dont-block-event-loop
title: Don't Block the Event Loop (or the Worker Pool)
author: Node.js project
url: https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
kind: docs
primary: true
---

## Summary

The Node.js guide on keeping the event loop and the libuv worker pool
unblocked. Node serves many clients with few threads, so any callback
that does a lot of CPU work delays every other client. It lists which
built-in APIs run on the worker pool (file system and DNS lookups
because they block; crypto and zlib because they're CPU-heavy) and how
to split or offload heavy work.

## Key claims

- Few threads for many clients is why Node scales. "The secret to the scalability of Node.js is that it uses a small number of threads to handle many clients." (Summary)
- Rule of thumb. "Node.js is fast when the work associated with each client at any given time is \"small\"." (Summary)
- One event loop plus a pool of k workers. "In Node.js there are two types of threads: one Event Loop (aka the main loop, main thread, event thread, etc.), and a pool of k Workers in a Worker Pool (aka the threadpool)." (Why should I avoid blocking...)
- A blocked thread can't serve anyone else. "While a thread is blocked working on behalf of one client, it cannot handle requests from any other clients." (Why should I avoid blocking...)
- Blocking is also a DoS risk. "a malicious client could submit this \"evil input\", make your threads block, and keep them from working on other clients." (Why should I avoid blocking..., 2. Security)
- The worker pool takes I/O with no non-blocking OS version, and CPU-heavy tasks. "This includes I/O for which an operating system does not provide a non-blocking version, as well as particularly CPU-intensive tasks." (What code runs on the Worker Pool?)
- I/O-intensive on the pool: dns.lookup(), file system APIs; CPU-intensive: crypto.pbkdf2(), crypto.scrypt(), zlib. (What code runs on the Worker Pool?, list)
- With thread-per-client, the OS keeps things fair; with few threads, your code must. "The fair treatment of clients is thus the responsibility of your application." (What does this mean for application design?)
- Every callback, await and then must finish quickly. "each of your JavaScript callbacks should complete quickly. This of course also applies to your await's, your Promise.then's, and so on." (Don't block the Event Loop)
- Bound input size to bound worst-case time. "for complex tasks you should consider bounding the input and rejecting inputs that are too long." (How careful should you be?)
- Vulnerable regexps can take exponential time and block the loop (REDOS). (Blocking the Event Loop: REDOS)
- Partitioning (yielding with setImmediate) keeps work on the loop but uses only one core; offloading moves it to a pool. "Remember, the Event Loop should orchestrate client requests, not fulfill them itself." (Offloading)
- Don't fork a child per client. "You can receive client requests more quickly than you can create and manage children, and your server might become a fork bomb." (How to offload)
- Offloading costs serialization, since workers can't touch the loop's objects. "Instead, you have to serialize and deserialize any objects you wish to share." (Downside of offloading)
- CPU and I/O work behave differently. "You may wish to distinguish between CPU-intensive and I/O-intensive tasks because they have markedly different characteristics." (Some suggestions for offloading)
- A CPU task only progresses while it has a core; more workers than cores is waste. "If you have 4 logical cores and 5 Workers, one of these Workers cannot make progress." (Some suggestions for offloading)
- An I/O task progresses while its thread sleeps. "Thus, I/O-intensive tasks will be making progress even while the associated thread is not running." (Some suggestions for offloading)
- Mixing both in one pool can hurt. "If you rely on only one Worker Pool, e.g. the Node.js Worker Pool, then the differing characteristics of CPU-bound and I/O-bound work may harm your application's performance." (Some suggestions for offloading)
- JSON.parse and JSON.stringify are linear but can be slow on big inputs. "While these are O(n) in the length of the input, for large n they can take surprisingly long." (JSON DOS)
- A worker takes tasks from a real queue and signals the loop when done. "A Worker pops a task from this queue and works on it, and when finished the Worker raises an \"At least one task is finished\" event for the Event Loop." (How does Node.js decide what code to run next?)
- Partitioning: split work so it regularly yields to other events. "You could partition your calculations so that each runs on the Event Loop but regularly yields (gives turns to) other pending events." (Partitioning)
- Offloading: move complicated work to a worker pool. "For a complicated task, move the work off of the Event Loop onto a Worker Pool." (Offloading)

## Visuals worth redrawing

None.

## My notes

- The offloading section names C++ addons, Child Process and Cluster
  as the ways to offload; it doesn't mention `worker_threads`.
