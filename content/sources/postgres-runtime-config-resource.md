---
id: postgres-runtime-config-resource
title: "PostgreSQL documentation, 19.4 Resource Consumption"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/runtime-config-resource.html
kind: docs
primary: true
---

## Summary

The memory, disk and I/O settings (read at version 18.6).
Used for shared_buffers, work_mem and the Postgres 18 I/O method.

## Key claims

- shared_buffers default is typically 128 MB. "The default is typically 128 megabytes (128MB), but might be less if your kernel settings will not support it (as determined during initdb)." (19.4.1, shared_buffers)
- A starting point is 25% of RAM on a dedicated server. "If you have a dedicated database server with 1GB or more of RAM, a reasonable starting value for shared_buffers is 25% of the memory in your system." (19.4.1, shared_buffers)
- Postgres also relies on the OS cache, so over 40% rarely helps. "because PostgreSQL also relies on the operating system cache, it is unlikely that an allocation of more than 40% of RAM to shared_buffers will work better than a smaller amount." (19.4.1, shared_buffers)
- work_mem, default 4 MB, applies per sort or hash operation, so one query and many sessions can use many times that. "Therefore, the total memory used could be many times the value of work_mem" (19.4.1, work_mem)
- io_method selects how asynchronous I/O runs: worker, io_uring or sync; default worker. "Selects the method for executing asynchronous I/O." (19.4.5, io_method)
- io_workers default 3. "Selects the number of I/O worker processes to use. The default is 3." (19.4.5, io_workers)
- A block is BLCKSZ bytes, typically 8 kB. "it is taken as blocks, that is BLCKSZ bytes, typically 8kB." (19.4.1, shared_buffers)
- io_uring needs a build with liburing. "io_uring (execute asynchronous I/O using io_uring, requires a build with --with-liburing / -Dliburing)" (19.4.5, io_method)

## Visuals worth redrawing

None.

## My notes

- huge_pages default try; relevant to per-connection memory (see
  freund-connection-scalability-2020).
