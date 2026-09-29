---
id: crun-readme
title: crun README
author: Giuseppe Scrivano and crun contributors
url: https://github.com/containers/crun
kind: code
primary: true
---

## Summary

The README of crun, an OCI runtime written in C, and its case against
runc: no Go runtime to work around, smaller memory footprint, faster
start, usable as a library. Includes the author's own start-time
comparison.

## Key claims

- What crun is. "A fast and low-memory footprint OCI Container Runtime fully written in C." (intro)
- runc is the most used implementation, written in Go, and re-execs itself with a C module to set up. "runc, the most used implementation of the OCI runtime specs written in Go, re-execs itself and use a module written in C for setting up the environment before the container process starts." (Why another implementation?)
- The author's measurement: 100 sequential `/bin/true` containers, 1.69 s with crun, 3.34 s with runc. "This is the elapsed time on my machine for running sequentially 100 containers, the containers run `/bin/true`" (Performance)
- Lower footprint lets it run under tighter memory limits; the example runs with a 512k limit where runc failed at 4M. "crun requires fewer resources, so it is also possible to set stricter limits on the memory allowed in the container" (Performance)
- The author argues C suits a low-level tool. "I believe C is a better fit for a lower level tool like a container runtime." (Why another implementation?)
- The timing table: 100 /bin/true, crun 0:01.69, runc 0:3.34. (Performance, table)

## Visuals worth redrawing

None.

## My notes

- The timing is one machine, one author, no versions given. Quote as
  "the crun README reports", never as a general number. The phase 14
  lab compares runc and crun properly.
