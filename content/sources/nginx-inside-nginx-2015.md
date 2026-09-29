---
id: nginx-inside-nginx-2015
title: "Inside NGINX: How We Designed for Performance & Scale"
author: Owen Garrett (NGINX)
url: https://blog.nginx.org/blog/inside-nginx-how-we-designed-for-performance-scale
kind: blog
primary: true
---

## Summary

NGINX's own explanation (2015) of its process model: a master process
and one single-threaded worker per core, each worker running many
connections as non-blocking state machines. It contrasts this with the
thread- or process-per-connection model most servers used.

## Key claims

- Per-connection threads or processes are simple but don't scale to thousands of connections. "This architecture is simple and easy to implement, but it does not scale when the application needs to handle thousands of simultaneous connections." (Why Is Architecture Important?)
- Servers cope with hundreds of threads until memory runs out or context switches pile up. "Most modern servers can handle hundreds of small, active threads or processes simultaneously, but performance degrades seriously once memory is exhausted or when high I/O load causes a large volume of context switches." (Why Is Architecture Important?)
- NGINX recommends one worker process per CPU core. "The NGINX configuration recommended in most cases – running one worker process per CPU core – makes the most efficient use of hardware resources." (How Does NGINX Work?)
- Each worker is single-threaded and handles many connections without blocking. "Each worker process is single‑threaded and runs independently, grabbing new connections and processing them." (How Does NGINX Work?)
- Each worker handles many connections nonblocking, which reduces context switches. "Each worker process handles multiple connections in a nonblocking fashion, reducing the number of context switches." (How Does NGINX Work?)
- Connections are driven by state machines (HTTP, stream, mail). "These connections are assigned to a state machine" (Inside the NGINX Worker Process)
- In the blocking model, a thread spends most of its time waiting on the client. "During the time the process is run by the server, it spends most of its time ‘blocked’ – waiting for the client to complete its next move." (A Blocking State Machine)
- A light connection maps to a heavy OS object in that model. "the rather lightweight HTTP connection, represented by a file descriptor and a small amount of memory, maps to a separate thread or process, a very heavyweight operating system object." (A Blocking State Machine)
- A worker never blocks on network traffic. "A worker never blocks on network traffic, waiting for its “opponent” (the client) to respond." (NGINX is a True Grandmaster)
- Each new connection costs a file descriptor and a little memory. "Each new connection creates another file descriptor and consumes a small amount of additional memory in the worker process." (Why Is This Faster than a Blocking, Multiprocess Architecture?)
- Context switches happen only when there's no work. "Context switches are relatively infrequent and occur when there is no work to be done." (Why Is This Faster...)
- The master process hands each worker its listening sockets. "Each NGINX worker process is initialized with the NGINX configuration and is provided with a set of listen sockets by the master process." (Inside the NGINX Worker Process)
- Per-connection overhead is very small. "There is very little additional overhead per connection." (Why Is This Faster...)
- Besides HTTP, NGINX has state machines for raw TCP streams and several mail protocols. "NGINX also implements state machines for stream (raw TCP) traffic and for a number of mail protocols (SMTP, IMAP, and POP3)." (Inside the NGINX Worker Process)

## Visuals worth redrawing

- The chess analogy: one grandmaster per game (thread per connection)
  vs one grandmaster playing many boards (event loop).

## My notes

- "Hundreds of thousands of connections per worker" is a vendor claim
  with no test setup; not used as a number.
