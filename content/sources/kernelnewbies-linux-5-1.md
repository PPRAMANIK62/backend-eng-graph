---
id: kernelnewbies-linux-5-1
title: Linux 5.1
author: Kernel Newbies
url: https://kernelnewbies.org/Linux_5.1
kind: docs
primary: false
---

## Summary

Kernel Newbies' release summary for Linux 5.1 (released in 2019), the
release that merged io_uring. Its first featured item explains why the
old aio interface wasn't enough.

## Key claims

- Linux 5.1 includes io_uring. "This release includes io_uring, an high-performance interface for asynchronous I/O" (Summary)
- The old aio only supported unbuffered (O_DIRECT) I/O. "It does not support buffered I/O, only unbuffered (O_DIRECT) I/O, which only a subset of a subset of applications use." (1.1 High-performance asynchronous I/O with io_uring)
- io_uring was merged in 5.1 for both buffered and unbuffered async I/O. "A new asynchronous interface, io_uring, has been created and merged in the release, with the purpose of finally adding fast, scalable asynchronous I/O to Linux, both buffered and unbuffered." (1.1)
- liburing was created alongside to hide the ring details. (1.1)

## Visuals worth redrawing

None.

## My notes

- Release summary written by volunteers, not by the io_uring author;
  Axboe's own document is the primary source for the design.
