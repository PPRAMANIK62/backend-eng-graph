---
id: man7-namespaces
title: namespaces(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/namespaces.7.html
kind: docs
primary: true
---

## Summary

The overview man page for Linux namespaces (man-pages 6.19): the eight
namespace types and what each isolates, the system calls that create and
join them (clone, unshare, setns), the `/proc/pid/ns/` handles, and what
keeps a namespace alive.

## Key claims

- What a namespace is. "A namespace wraps a global system resource in an abstraction that makes it appear to the processes within the namespace that they have their own isolated instance of the global resource." (DESCRIPTION)
- Containers are one use. "One use of namespaces is to implement containers." (DESCRIPTION)
- The table of types: cgroup (cgroup root directory), IPC (System V IPC, POSIX message queues), network (network devices, stacks, ports), mount (mount points), PID (process IDs), time (boot and monotonic clocks), user (user and group IDs), UTS (hostname and NIS domain name). "Network CLONE_NEWNET network_namespaces(7) Network devices, stacks, ports, etc." (Namespace types table)
- clone with CLONE_NEW* flags creates new namespaces for the child. "If the flags argument of the call specifies one or more of the CLONE_NEW* flags listed above, then new namespaces are created for each flag, and the child process is made a member of those namespaces." (The namespaces API, clone)
- setns joins an existing namespace through a /proc/pid/ns file descriptor. "The setns(2) system call allows the calling process to join an existing namespace." (The namespaces API)
- unshare moves the caller into new namespaces. "The unshare(2) system call moves the calling process to a new namespace." (The namespaces API)
- Creating namespaces needs CAP_SYS_ADMIN, except user namespaces since Linux 3.8. "User namespaces are the exception: since Linux 3.8, no privilege is required to create a user namespace." (The namespaces API)
- Why creating namespaces needs privilege. "Creation of new namespaces using clone(2) and unshare(2) in most cases requires the CAP_SYS_ADMIN capability, since, in the new namespace, the creator will have the power to change global resources that are visible to other processes that are subsequently created in, or join the namespace." (The namespaces API)
- Per-user limits on how many namespaces of each type can be created, since Linux 4.9. "The files in the /proc/sys/user directory (which is present since Linux 4.9) expose limits on the number of namespaces of various types that can be created." (The /proc/sys/user directory)
- Two processes in the same namespace have the same device and inode number on their /proc/pid/ns link. "If two processes are in the same namespace, then the device IDs and inode numbers of their /proc/pid/ns/xxx symbolic links will be the same" (The /proc/pid/ns/ directory)
- Handles appeared per type over time: cgroup since Linux 4.6, time since Linux 5.6, mnt, pid and user links since Linux 3.8. "/proc/pid/ns/time (since Linux 5.6)" (The /proc/pid/ns/ directory)
- A namespace dies with its last process, unless something pins it. "Absent any other factors, a namespace is automatically torn down when the last process in the namespace terminates or leaves the namespace." (Namespace lifetime)
- An open fd or bind mount of the ns file keeps it alive. "An open file descriptor or a bind mount exists for the corresponding /proc/pid/ns/* file." (Namespace lifetime)
- Changes are shared inside, hidden outside. "Changes to the global resource are visible to other processes that are members of the namespace, but are invisible to other processes." (DESCRIPTION)

## Visuals worth redrawing

The namespace types table.

## My notes

- Good for the list of types and the API. Per-type detail is in the
  per-type pages (pid_namespaces, network_namespaces, user_namespaces).
