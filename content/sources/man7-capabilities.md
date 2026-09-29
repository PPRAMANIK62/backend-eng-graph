---
id: man7-capabilities
title: capabilities(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/capabilities.7.html
kind: docs
primary: true
---

## Summary

The man page for Linux capabilities (man-pages 6.19): root's power split
into separate units since Linux 2.2, which a container runtime can hand
out or withhold one by one.

## Key claims

- Traditional Unix: root bypasses all permission checks. "Privileged processes bypass all kernel permission checks, while unprivileged processes are subject to full permission checking" (DESCRIPTION)
- Since Linux 2.2 root's privileges are split into capabilities. "Starting with Linux 2.2, Linux divides the privileges traditionally associated with superuser into distinct units, known as capabilities, which can be independently enabled and disabled." (DESCRIPTION)
- Capabilities are per thread. "Capabilities are a per-thread attribute." (DESCRIPTION)
- CAP_SYS_ADMIN is overloaded; newer capabilities were split off it. "to separate out BPF functionality from the overloaded CAP_SYS_ADMIN capability." (Capabilities list, CAP_BPF)
- Each thread has several capability sets. "Each thread has the following capability sets containing zero or more of the above capabilities:" (Thread capability sets)
- Permitted limits effective. "This is a limiting superset for the effective capabilities that the thread may assume." (Thread capability sets, Permitted)
- Ambient keeps capabilities across exec of an unprivileged program. "This is a set of capabilities that are preserved across an execve(2) of a program that is not privileged." (Ambient, since Linux 4.3)
- Example capability. "Bind a socket to Internet domain privileged ports (port numbers less than 1024)." (CAP_NET_BIND_SERVICE)
- Example capability. "Use RAW and PACKET sockets;" (CAP_NET_RAW)
- CAP_PERFMON was split off too. "This capability was added in Linux 5.8 to separate out performance monitoring functionality from the overloaded CAP_SYS_ADMIN capability." (CAP_PERFMON)
- The bounding set can be dropped. "drop capabilities from the bounding set (via prctl(2) PR_CAPBSET_DROP)" (CAP_SETPCAP)

## Visuals worth redrawing

None.

## My notes

- runc's default `config.json` (runc README) grants a short list such as
  CAP_AUDIT_WRITE, CAP_KILL, CAP_NET_BIND_SERVICE.
