---
id: google-kctf-io-uring-2023
title: Learnings from kCTF VRP's 42 Linux kernel exploits submissions
author: Tamás Koczka (Google)
url: https://security.googleblog.com/2023/06/learnings-from-kctf-vrps-42-linux.html
kind: blog
primary: true
---

## Summary

Google's security blog on what its kernel exploit reward program
learned in 2023. Most submitted exploits used io_uring, so Google
limited or turned off io_uring across its products and servers.

## Key claims

- 60% of submissions exploited io_uring. "60% of the submissions exploited the io_uring component of the Linux kernel (we paid out around 1 million USD for io_uring alone)." (Learnings and Statistics)
- io_uring bugs were used in every submission that bypassed Google's mitigations. "io_uring vulnerabilities were used in all the submissions which bypassed our mitigations." (Learnings and Statistics)
- ChromeOS disabled it. "ChromeOS: We disabled io_uring (while we explore new ways to sandbox it)." (Limiting io_uring)
- Android apps can't reach it. "Android: Our seccomp-bpf filter ensures that io_uring is unreachable to apps." (Limiting io_uring)
- Disabled on Google's production servers. "It is disabled on production Google servers." (Limiting io_uring)
- Their judgement: only for trusted components. "For these reasons, we currently consider it safe only for use by trusted components." (Limiting io_uring)
- It's fairly new, still actively developed, and still has severe vulnerabilities. "it is a fairly new part of the kernel. As such, io_uring continues to be actively developed, but it is still affected by severe vulnerabilities and also provides strong exploitation primitives." (Limiting io_uring)

## Visuals worth redrawing

None.

## My notes

- A 2023 position. Check whether it has changed before repeating it as
  current.
