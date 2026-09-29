---
id: man7-io-uring
title: io_uring(7), Linux manual page
author: liburing project (Jens Axboe and contributors), published on man7.org
url: https://man7.org/linux/man-pages/man7/io_uring.7.html
kind: docs
primary: true
---

## Summary

The overview man page for io_uring, from the liburing project: the
programming model (fill SQEs, call io_uring_enter, read CQEs), memory
ordering, pointer lifetimes, CQE flags, and why the shared-ring design
cuts system calls. Describes kernels up to at least 6.12.

## Key claims

- io_uring is Linux-only asynchronous I/O built on rings shared between user space and the kernel. "io_uring is a Linux-specific API for asynchronous I/O." (DESCRIPTION)
- Each SQE is the equivalent of a system call you would otherwise make. "Each I/O operation is, in essence, the equivalent of a system call you would have made otherwise, if you were not using io_uring." (DESCRIPTION)
- You add SQEs, then call io_uring_enter to tell the kernel. "After you add one or more SQEs, you need to call io_uring_enter(2) to tell the kernel to dequeue your I/O requests off the SQ and begin processing them." (DESCRIPTION)
- One CQE per SQE, normally. "The kernel places exactly one matching CQE in the CQ for every SQE you submit on the SQ." (DESCRIPTION)
- errno isn't used; res carries -errno. "Given that io_uring is an async interface, errno is never used for passing back error information." (DESCRIPTION)
- Requests can complete in any order. "It is important to remember that I/O requests submitted to the kernel can complete in any order." (DESCRIPTION)
- Don't have two sends or two receives in flight on one TCP socket. "it is generally unsafe to have more than one outstanding send, or more than one outstanding receive (the two directions are independent) on a given socket at a time" (DESCRIPTION)
- Exceptions to one-CQE-per-SQE: CQE_SKIP_SUCCESS posts none, multishot posts many. "like not posting a CQE for every SQE when setting IOSQE_CQE_SKIP_SUCCESS in the SQE or posting multiple CQEs for a single SQE for multi shot operations" (DESCRIPTION)
- Buffers used by a read or write must stay valid until completion. "the pointers to a buffer used as part of a IORING_OP_WRITE or IORING_OP_READ operation must remain valid until completion." (SQE pointer lifetimes & data stability)
- Spectre and Meltdown workarounds made system calls more expensive on affected hardware. "some of these workarounds are around the system call interface, making system calls not as cheap as before on affected hardware." (io_uring performance)
- Many SQEs can go in with one io_uring_enter. "you can batch several requests in one go, simply by queueing up multiple SQEs, each describing an I/O operation you want and make a single call to io_uring_enter(2)." (io_uring performance)
- Requests are attempted in order but may execute and complete in any order. "the requests are attempted in order, however that doesn't imply any sort of ordering on their execution or completion." (DESCRIPTION)

## Visuals worth redrawing

None beyond the two rings (see axboe-io-uring-2019).

## My notes

- man7.org hosts it but the page comes from the liburing repository.
