---
id: man7-cgroups
title: cgroups(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/cgroups.7.html
kind: docs
primary: true
---

## Summary

The man page overview of cgroups v1 and v2 (man-pages 6.19). Useful
mainly for the history: when cgroups arrived, when each v1 controller
arrived, and when v2 became official.

## Key claims

- What cgroups are. "Control groups, usually referred to as cgroups, are a Linux kernel feature which allow processes to be organized into hierarchical groups whose usage of various types of resources can then be limited and monitored." (DESCRIPTION)
- First release in Linux 2.6.24. "The initial release of the cgroups implementation was in Linux 2.6.24." (Cgroups version 1 and version 2)
- Work on v2 started in Linux 3.10. "starting in Linux 3.10, work began on a new, orthogonal implementation to remedy these problems." (Cgroups version 1 and version 2)
- v2 became official in Linux 4.5. "the new version (cgroups version 2) was eventually made official with the release of Linux 4.5." (Cgroups version 1 and version 2)
- The memory controller came in Linux 2.6.25. "memory (since Linux 2.6.25; CONFIG_MEMCG)" (Cgroups version 1 controllers)
- CPU bandwidth control was added in Linux 3.2. "In Linux 3.2, this controller was extended to provide CPU "bandwidth" control." (Cgroups version 1 controllers, cpu)

## Visuals worth redrawing

None.

## My notes

- For v2 details use kernel-cgroup-v2; this page is for dates of
  arrival (versions).
