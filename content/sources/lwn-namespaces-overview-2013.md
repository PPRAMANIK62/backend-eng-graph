---
id: lwn-namespaces-overview-2013
title: "Namespaces in operation, part 1: namespaces overview"
author: Michael Kerrisk (LWN.net)
url: https://lwn.net/Articles/531114/
kind: blog
primary: true
---

## Summary

The first article of Kerrisk's LWN series on namespaces (2013), written
when user namespaces were completed in Linux 3.8. Goes through the six
namespace types that existed then, in the order they were added, with
the kernel version for each and what containers use them for. Kerrisk
maintains the Linux man pages, so it's close to primary.

## Key claims

- Goal of namespaces: an illusion of being alone on the system. "One of the overall goals of namespaces is to support the implementation of containers, a tool for lightweight virtualization (as well as other purposes) that provides a group of processes with the illusion that they are the only processes on the system." (The namespaces)
- Mount namespaces came first, in Linux 2.4.19, and are why the flag is CLONE_NEWNS. "Mount namespaces were the first type of namespace to be implemented on Linux, appearing in 2002." (The namespaces)
- Mount namespaces are a safer, more flexible chroot. "by contrast with the use of the chroot() system call, mount namespaces are a more secure and flexible tool for this task." (The namespaces)
- UTS and IPC namespaces: Linux 2.6.19. "UTS namespaces (CLONE_NEWUTS, Linux 2.6.19) isolate two system identifiers—nodename and domainname—returned by the uname() system call" (The namespaces)
- PID namespaces: Linux 2.6.24; a process has a PID inside and outside. "From the point of view of a particular PID namespace instance, a process has two PIDs: the PID inside the namespace, and the PID outside the namespace on the host system." (The namespaces)
- Network namespaces: started in 2.6.24, largely done by about 2.6.29; each container can bind port 80. "it is possible to have multiple containerized web servers on the same host system, with each server bound to port 80 in its (per-container) network namespace." (The namespaces)
- User namespaces: started in 2.6.23, completed in 3.8; unprivileged creation since 3.8. "starting with Linux 3.8, unprivileged processes can create user namespaces in which they have full privileges, which in turn allows any other type of namespace to be created inside a user namespace." (introduction)
- Kerrisk warned that user namespaces might still hide security bugs. "it may happen that user namespaces have some as-yet unknown security issues that remain to be found and fixed in the future." (The namespaces)
- Mount namespaces arrived in Linux 2.4.19. "Mount namespaces (CLONE_NEWNS, Linux 2.4.19) isolate the set of filesystem mount points seen by a group of processes." (The namespaces)
- Why the flag is just NEWNS. "at that time no one seems to have been thinking that other, different types of namespace might be needed in the future." (The namespaces)
- PID namespaces: Linux 2.6.24. "PID namespaces (CLONE_NEWPID, Linux 2.6.24) isolate the process ID number space." (The namespaces)
- The user namespace work was known to be subtle. "However, the changes wrought by this work are subtle and wide ranging." (The namespaces, user namespaces)

## Visuals worth redrawing

None.

## My notes

- Written in 2013, so it lists six types; cgroup (Linux 4.6) and time
  (Linux 5.6) namespaces came later (man7-namespaces).
- In the comments, Eric Biederman (who wrote user namespaces) says
  namespaces and cgroups are orthogonal by design. Comment, not article;
  not cited.
