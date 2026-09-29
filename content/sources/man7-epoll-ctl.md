---
id: man7-epoll-ctl
title: epoll_ctl(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/epoll_ctl.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for epoll_ctl (man-pages 6.19): adding, changing and
removing entries in an epoll interest list, and the event flags,
including EPOLLET, EPOLLONESHOT and EPOLLEXCLUSIVE.

## Key claims

- Level-triggered is the default; EPOLLET asks for edge-triggered. "The default behavior for epoll is level- triggered." (EPOLLET)
- EPOLLONESHOT (Linux 2.6.2) disables the fd after one event until you re-arm it. "This means that after an event notified for the file descriptor by epoll_wait(2), the file descriptor is disabled in the interest list and no other events will be reported by the epoll interface." (EPOLLONESHOT)
- Re-arming takes another epoll_ctl call. "The user must call epoll_ctl() with EPOLL_CTL_MOD to rearm the file descriptor with a new event mask." (EPOLLONESHOT)
- EPOLLEXCLUSIVE (Linux 4.5): when several epoll instances watch one fd, one or more of them get the event instead of all. "When a wakeup event occurs and multiple epoll file descriptors are attached to the same target file using EPOLLEXCLUSIVE, one or more of the epoll file descriptors will receive an event with epoll_wait(2)." (EPOLLEXCLUSIVE)
- Without it, all of them are woken. "The default in this scenario (when EPOLLEXCLUSIVE is not set) is for all epoll file descriptors to receive an event." (EPOLLEXCLUSIVE)
- It exists to avoid thundering herds. "EPOLLEXCLUSIVE is thus useful for avoiding thundering herd problems in certain scenarios." (EPOLLEXCLUSIVE)
- epoll_ctl arrived with Linux 2.6. "Linux 2.6, glibc 2.3.2." (HISTORY)

## Visuals worth redrawing

None.

## My notes

- "One or more" is deliberately loose: EPOLLEXCLUSIVE reduces wakeups
  but doesn't promise exactly one.
