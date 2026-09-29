---
id: axboe-io-uring-2019
title: Efficient IO with io_uring
author: Jens Axboe
url: https://kernel.dk/io_uring.pdf
kind: paper
primary: true
---

## Summary

The design document for io_uring by its author (version 0.4, 2019).
Why Linux's old aio interface failed, the design goals, the two shared
rings (submission and completion), the sqe and cqe structures, the three
system calls, ordering with drain and links, fixed files and buffers,
polled I/O, kernel-side submission polling (SQPOLL), and some block-I/O
performance numbers. Written while io_uring was in release candidates
for its first kernel.

## Key claims

- Linux aio only did asynchronous I/O with O_DIRECT. "The biggest limitation is undoubtedly that it only supports async IO for O_DIRECT (or un-buffered) accesses." (1.0 Introduction)
- aio submission could still block, e.g. waiting on metadata or request slots. "There are a number of ways that the IO submission can end up blocking" (1.0 Introduction)
- aio needed at least two system calls per I/O, costly after Spectre and Meltdown. "IO always requires at least two system calls (submit + wait-for-completion), which in these post spectre/meltdown days is a serious slowdown." (1.0 Introduction)
- Applications had to build their own I/O thread pools. "There is absolutely no reason that applications or libraries continue to need to create private IO offload thread pools to get decent async IO" (1.0 Introduction)
- The core is a pair of single-producer single-consumer rings shared with the kernel, synchronized by memory ordering instead of locks. "With a shared ring buffer, we could eliminate the need to have shared locking between the application and the kernel, getting away with some clever use of memory ordering and barriers instead." (4.0 Enter io_uring)
- For submission the app produces and the kernel consumes; for completion it's the other way round. "For submitting IO, the application is the producer and the kernel is the consumer." (4.0 Enter io_uring)
- The rings are named the submission queue and completion queue. "They are suitably named submission queue (SQ), and completion queue (CQ), and form the foundation of the new interface." (4.0 Enter io_uring)
- user_data is carried untouched from request to completion, to match them up. "The kernel will not touch this field, it's simply carried straight from submission to completion event." (4.1 Data structures)
- res works like a system call's return value, with a negative errno on failure. "If a failure occurred, it will contain the negative error value." (4.1 Data structures)
- The CQ ring is twice the size of the SQ ring by default. "By default, the CQ ring is twice the size of the SQ ring." (4.2 Communication channel)
- Completions come in any order. "Completion events may arrive in any order, there is no ordering between the request submission and the association completion." (4.2 Communication channel)
- One io_uring_enter call can both submit and wait. "Having the single call available to both submit and wait for completions means that the application can both submit and wait for request completions with a single system call." (5.0 io_uring interface)
- Completions can be read straight from the CQ ring without a system call. "completions can be consumed by the application without necessarily having to call io_uring_enter(2) with IORING_ENTER_GETEVENTS set." (5.0 io_uring interface)
- IOSQE_IO_LINK makes the next sqe wait for this one to succeed. "If set, the next sqe will not be started before the previous sqe has completed successfully." (5.2 Linked SQEs)
- Fixed files avoid taking a file reference per I/O; fixed buffers avoid mapping pages per I/O. (8.1 Fixed files and buffers)
- With SQPOLL, a kernel thread picks up new sqes, so a busy app can do I/O with no system calls. "As long as the application keeps driving IO, IORING_SQ_NEED_WAKEUP will never be set, and we can effectively perform IO without performing a single system call." (8.3 Kernel side polling)
- The SQPOLL thread sleeps after one second idle by default, and the app must wake it. "If this member isn't set, the kernel defaults to one second of idle time before putting the thread to sleep." (8.3 Kernel side polling)
- Block I/O numbers on his test box: 1.7M 4k IOPS polled, aio 608K, 1.2M without polling. "For peak performance, io_uring helps us get to 1.7M 4k IOPS with polling. aio reaches a performance cliff much lower than that, at 608K." (9.1 Raw performance)
- A thread-pool approach pays context switches even when the data is already in the page cache; io_uring serves those inline. "Hence an application with an IO thread pool always has to bounce requests to an async context, resulting in at least two context switches." (9.2 Buffered async performance)
- For I/O that won't block, the data is ready by the time the submit call returns. "Once the IO submission call returns, the application will already have a completion event in the CQ ring waiting for it and the data will have already been copied." (9.2 Buffered async performance)
- user_data is commonly a pointer to the original request. "One common use case is to have it be the pointer of the original request." (4.1 Data structures)
- A user-space pool can't know whether data is already cached. "A userspace application has no way of knowing if the data it is going to ask for next is cached or not." (9.2 Buffered async performance)
- The hard part of the raw interface is memory ordering; he recommends the liburing helpers. "the main complication is really the need for explicit memory ordering primitives." (9.0 Performance); "I would encourage applications to always take advantage of the liburing provided helpers to the extent possible." (7.2)

- user_data is a 64-bit field in both the sqe and the cqe (`__u64 user_data;` in struct io_uring_sqe and struct io_uring_cqe). (4.1 Data structures)
- The benchmark reads the block device or file at random offsets. "measure performance by randomly reading from the block device or file." (9.1 Raw performance)

## Visuals worth redrawing

- The two rings: application writes sqes at the SQ tail, kernel reads at
  the head; kernel writes cqes at the CQ tail, application reads at the
  head.

## My notes

- Opened through the Wayback Machine copy of this URL: kernel.dk's TLS
  certificate didn't match the host name when I tried it directly.
- Section 8.3 says SQPOLL is privileged; io_uring_setup(2) says that was
  relaxed in 5.11 and 5.13. Use the man page for current rules.
- The IOPS numbers are block I/O on Axboe's box, not networking.
- Later re-check: the direct URL now returns 404 as well. The Wayback Machine copy (https://web.archive.org/web/2024/https://kernel.dk/io_uring.pdf) still matches every quote checked.
