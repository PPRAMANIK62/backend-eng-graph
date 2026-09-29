---
id: kegel-c10k
title: The C10K problem
author: Dan Kegel
url: http://www.kegel.com/c10k.html
kind: blog
primary: true
---

## Summary

The page that named the problem: how to make one server handle ten
thousand clients at once. Kegel lists the I/O strategies of the time
(one thread per client with blocking I/O, one thread for many clients
with non-blocking I/O and readiness notification, asynchronous I/O with
completion notification, servers in the kernel) and the OS limits each
one hits. Written from 1999, last substantially updated in 2014, so its
OS details are from the Linux 2.4 and 2.6 era. Primary in the sense that
Kegel coined the name and collected the discussion first-hand.

## Key claims

- The goal: web servers should handle ten thousand clients at the same time. "It's time for web servers to handle ten thousand clients simultaneously, don't you think?" (opening)
- Hardware wasn't the limit: a 1000 MHz machine with 2 GB of RAM and gigabit Ethernet gives each of 20,000 clients 50 kHz, 100 KB and 50 kbit/s. "at 20000 clients, that's 50KHz, 100Kbytes, and 50Kbits/sec per client." (opening)
- "So hardware is no longer the bottleneck." (opening)
- A real site did it in 1999. "In 1999 one of the busiest ftp sites, cdrom.com, actually handled 10000 clients simultaneously through a Gigabit Ethernet pipe." (opening)
- The design choices are how to issue many I/O calls from one thread (blocking calls plus many threads, non-blocking calls plus readiness notification, or asynchronous calls plus completion notification) and how to control the code serving each client (process per client, OS thread per client, or one OS thread for many clients using user-level threads, state machines or continuations). (I/O Strategies)
- User-level threads were one of the listed options for serving many clients from one OS thread. "a user-level thread (e.g. GNU state threads, classic Java with green threads)" (I/O Strategies)
- Readiness notification is only a hint, so sockets must be non-blocking. "it's particularly important to remember that readiness notification from the kernel is only a hint; the file descriptor might not be ready anymore when you try to read from it." (section 1)
- Non-blocking mode does nothing for disk files, so one disk read can stall every client of an event-driven server. "The first time a server needs disk I/O, its process blocks, all clients must wait, and that raw nonthreaded performance goes to waste." (section 1)
- Thread per client costs a stack per client. "Has the disadvantage of using a whole stack frame for each client, which costs memory." (section 4)
- On 32-bit Linux with 1 GB of user address space and 2 MB stacks, virtual memory runs out at 512 threads. "If each thread gets a 2MB stack (not an uncommon default value), you run out of *virtual memory* at (2^30 / 2^21) = 512 threads" (section 4)
- Smaller stacks help, but most thread libraries couldn't grow a stack once created. "since most thread libraries don't allow growing thread stacks once created, doing this means designing your program to minimize stack use." (section 4)
- Kegel expected thread per client to become workable for 10,000 clients as threading and 64-bit CPUs improved. "Perhaps in the not-too-distant future, those who prefer using one thread per client will be able to use that paradigm even for 10000 clients." (section 4)
- At the time of writing, other designs were the better bet for that many clients. "if you actually want to support that many clients, you're probably better off using some other paradigm." (section 4)
- M:N threading was thought faster but was hard to get right, and implementations were moving to 1:1. "At one point, M:N was thought to be higher performance, but it's so complex that it's hard to get right, and most people are moving away from it." (Note: 1:1 threading vs. M:N threading)
- On Linux 2.6 with NPTL, going above about 32,000 threads needed a larger vm.max_map_count. "/proc/sys/vm/max_map_count may need to be increased to go above 32000 or so threads." (Limits on threads)
- Readiness mechanisms listed: the traditional select() and poll(), /dev/poll (Solaris), kqueue (FreeBSD, NetBSD), epoll (Linux 2.6+). "The traditional select()" / "kqueue (FreeBSD, NetBSD)" / "epoll (Linux 2.6+)" (table of contents, I/O strategies)
- Workaround for the disk-file hole: helper threads or processes. "on systems that lack AIO, worker threads or processes that do the disk I/O can also get around this bottleneck." (section 1)
- Linux 2.4 had a system-wide thread cap. "Linux 2.4: /proc/sys/kernel/threads-max is the max number of threads" (Limits on threads)

## Visuals worth redrawing

None. The I/O strategies list could be drawn as a two-axis grid
(how I/O is issued, how per-client code is controlled).

## My notes

- Footer: copyright 1999-2018, last updated 2014 with a minor correction
  in 2019. Treat the OS-specific limits as history.
- It points to von Behren et al., "Why Events Are A Bad Idea", as the
  pro-thread view.
