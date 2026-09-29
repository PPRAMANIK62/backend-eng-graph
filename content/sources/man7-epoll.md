---
id: man7-epoll
title: epoll(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/epoll.7.html
kind: docs
primary: true
---

## Summary

The Linux man page for the epoll API as a whole (man-pages 6.19): the
epoll instance with its interest list and ready list, level-triggered
versus edge-triggered notification with a worked pipe example, a sample
event loop, and a Q&A on closing, duplicating and sharing descriptors.

## Key claims

- epoll watches many fds like poll, in either mode, and scales to many fds. "The epoll API can be used either as an edge-triggered or a level-triggered interface and scales well to large numbers of watched file descriptors." (DESCRIPTION)
- An epoll instance is a kernel object holding two lists. "The central concept of the epoll API is the epoll instance, an in- kernel data structure which, from a user-space perspective, can be considered as a container for two lists:" (DESCRIPTION)
- The interest list is what you registered; the ready list is filled by the kernel as I/O happens. "The ready list is dynamically populated by the kernel as a result of I/O activity on those file descriptors." (DESCRIPTION)
- epoll_create returns a file descriptor for the new instance. "epoll_create(2) creates a new epoll instance and returns a file descriptor referring to that instance." (DESCRIPTION)
- epoll_ctl adds to the interest list; epoll_wait blocks until something is ready. "epoll_wait(2) waits for I/O events, blocking the calling thread if no events are currently available." (DESCRIPTION)
- Pipe example: 2 kB written, reader woken, reads 1 kB; with EPOLLET the next wait may hang although data is still there. "the call to epoll_wait(2) done in step 5 will probably hang despite the available data still present in the file input buffer" (Level-triggered and edge-triggered)
- Edge-triggered means an event only when something changes. "edge-triggered mode delivers events only when changes occur on the monitored file descriptor" (Level-triggered and edge-triggered)
- The way to use edge-triggered: nonblocking fds, and wait only after EAGAIN. "(1) with nonblocking file descriptors; and (2) by waiting for an event only after read(2) or write(2) return EAGAIN." (Level-triggered and edge-triggered)
- Level-triggered is the default and behaves like a faster poll. "By contrast, when used as a level-triggered interface (the default, when EPOLLET is not specified), epoll is simply a faster poll(2), and can be used wherever the latter is used since it shares the same semantics." (Level-triggered and edge-triggered)
- With edge-triggered, one waiting thread is woken per ready event, which avoids thundering herds. "just one of the threads (or processes) is awoken from epoll_wait(2)." (Level-triggered and edge-triggered)
- Each watched fd costs about 160 bytes of kernel memory on a 64-bit kernel. "Each registered file descriptor costs roughly 90 bytes on a 32-bit kernel, and roughly 160 bytes on a 64-bit kernel." (/proc interfaces, max_user_watches)
- After EAGAIN, an event-driven program records its state and continues later. "An event-driven state machine application should, after having received EAGAIN, record its current state so that at the next call to do_use_fd() it will continue to read(2) or write(2) from where it stopped before." (Example for suggested usage)
- Several events between waits are combined into one. "They will be combined." (Questions and answers)
- An fd leaves the interest list only when every fd for the same open file description is closed. "A file descriptor is removed from an interest list only after all the file descriptors referring to the underlying open file description have been closed." (Questions and answers)
- dup, dup2, F_DUPFD and fork all make new fds for the same open file description. "Whenever a file descriptor is duplicated via dup(2), dup2(2), fcntl(2) F_DUPFD, or fork(2), a new file descriptor referring to the same open file description is created." (Questions and answers)
- So events can arrive for an fd you already closed, if a duplicate is open elsewhere. "This means that even after a file descriptor that is part of an interest list has been closed, events may be reported for that file descriptor if other file descriptors referring to the same underlying file description remain open." (Questions and answers)
- To avoid it, remove the fd with EPOLL_CTL_DEL before duplicating it. "the file descriptor must be explicitly removed from the interest list (using epoll_ctl(2) EPOLL_CTL_DEL) before it is duplicated." (Questions and answers)
- Draining one busy fd can starve the others; keep your own ready list and round-robin. "If there is a large amount of I/O space, it is possible that by trying to drain it the other files will not get processed causing starvation." (Possible pitfalls, Starvation)
- Other systems have kqueue (FreeBSD) and /dev/poll (Solaris). (VERSIONS)
- epoll arrived in Linux 2.5.44. "Linux 2.5.44. glibc 2.3.2." (HISTORY)

## Visuals worth redrawing

- The pipe example (write 2 kB, wait, read 1 kB, wait again) as two
  timelines, level-triggered and edge-triggered.

## My notes

- Registration is keyed on the fd number plus the open file description,
  which is why dup and fork surprise people.
