---
id: corbet-rethinking-splice-2023
title: Rethinking splice()
author: Jonathan Corbet, LWN.net
url: https://lwn.net/Articles/923237/
kind: blog
primary: false
---

## Summary

LWN's 2023 report on a kernel mailing list thread about splice. When a
file is spliced into a socket, the network stack reads the page cache
pages directly, so a write to the file before transmission finishes
can change what gets sent, and the caller can't tell when it's safe.

## Key claims

- splice sends file data to a socket straight out of the page cache. "the network layer will read that data directly out of the page cache without needing to make a copy in the kernel" (body)
- A later write to the file can change what goes out. "But if the file is written before network transmission is complete, the newly written data may be sent, even though that write happened after the splice() call was made" (body)
- The caller can't know when it's safe. "There is no easy way to know that the data has been transmitted and that it is safe to modify the file again." (body)
- Sharing the pages is the point of splice, so it won't be made copy-on-write. Torvalds: "the whole point of splice" (body)
- io_uring was suggested as a better interface because it has completions. "it has the completion mechanism that can let user space know when a given buffer is no longer in use." (body)

## Visuals worth redrawing

None.

## My notes

- sendfile's man page (man7-sendfile) states the same rule: the file
  must stay unmodified until the reader has consumed the data.
- Log brokers dodge this because closed segments never change and the
  active segment is only appended to.
