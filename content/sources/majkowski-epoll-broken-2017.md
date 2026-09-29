---
id: majkowski-epoll-broken-2017
title: Epoll is fundamentally broken 1/2
author: Marek Majkowski
url: https://idea.popcount.org/2017-02-20-epoll-is-fundamentally-broken-12/
kind: blog
primary: false
---

## Summary

Part three of Majkowski's series on I/O multiplexing, on his personal
blog (he also wrote Cloudflare's post on NGINX accept balancing). It walks through what goes wrong when
several threads use epoll on one listening socket: level-triggered wakes
everyone, edge-triggered wakes the wrong one or starves, and
EPOLLEXCLUSIVE (Linux 4.5) is the fix. Independent analysis, not by the
epoll authors.

## Key claims

- epoll came from Davide Libenzi in 2002; the same paragraph dates Windows IOCP to 1994 and FreeBSD's kqueue to 2000. "It was created by Davide Libenzi in 2002." and "For comparison: Windows did IOCP in 1994" (Epoll is fundamentally broken 1/2, intro)
- The two design complaints: multithreading, and registering the file description rather than the fd. "Epoll registers the file descripton, the kernel data structure, not file descriptor, the userspace handler pointing to it." (Why the critique?)
- Early epoll couldn't scale across threads; EPOLLONESHOT and EPOLLEXCLUSIVE fixed it. "This was not supported by early implementations of epoll and was fixed by EPOLLONESHOT and EPOLLEXCLUSIVE flags." (Why the critique?)
- Before Linux 4.5 epoll couldn't spread accept() across threads well. "Up until kernel 4.5 it wasn't possible to use epoll to scale out accepts." (Scaling out accept())
- Level-triggered wakes every waiting thread for each new connection. "Without special flags, in level-triggered mode, all the workers will be woken up on each and every new connection." (Level triggered - unnecessary wake-up)
- In level-triggered mode both threads wake; one accept succeeds and the other fails with EAGAIN. "Thread B: Performs accept() , this fails with EAGAIN. Waking up \"Thread B\" was completely unnecessary" (Level triggered - unnecessary wake-up)
- Edge-triggered can leave one thread taking every connection. "In this case all the connections will be received by Thread A and load balancing won't be achieved." (Edge triggered - unnecessary wake-up and starvation)
- The fix: Linux 4.5+ with level-triggered and EPOLLEXCLUSIVE. "The best and the only scalable approach is to use recent Kernel 4.5+ and use level-triggered events with EPOLLEXCLUSIVE flag." (Correct solution)
- The older workaround, edge-triggered plus EPOLLONESHOT, costs an extra epoll_ctl per event. (Correct solution)
- His advice: don't share epoll sets or registered fds across threads unless you must. "Avoid sharing epoll file descriptor across threads." (Why the critique?)

- Deregister fds from epoll before dup or close. "Explicitly deregister affected file descriptors from epoll set before calling dup/dup2/dup3 or close." (Why the critique?)

## Visuals worth redrawing

- The step-by-step traces of threads A and B for level-triggered and
  edge-triggered accept.

## My notes

- "descripton" typo is in the original.
- Part 2 covers the close/dup problem; epoll(7)'s Q&A says the same.
