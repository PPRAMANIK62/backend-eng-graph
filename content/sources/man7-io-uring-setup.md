---
id: man7-io-uring-setup
title: io_uring_setup(2), Linux manual page
author: liburing project (Jens Axboe and contributors), published on man7.org
url: https://man7.org/linux/man-pages/man2/io_uring_setup.2.html
kind: docs
primary: true
---

## Summary

The man page for io_uring_setup, from the liburing project: creating a
ring, the setup flags (IOPOLL, SQPOLL, COOP_TASKRUN, SINGLE_ISSUER and
more, each with the kernel version that added it), the feature bits, and
the errors, including the io_uring_disabled sysctl.

## Key claims

- The queues are shared, so no data is copied to start or finish I/O. "The submission and completion queues are shared between userspace and the kernel, which eliminates the need to copy data when initiating and completing I/O." (DESCRIPTION)
- IOPOLL busy-waits for completions instead of using interrupts: lower latency, more CPU. "Busy-waiting provides lower latency, but may consume more CPU resources than interrupt driven I/O." (IORING_SETUP_IOPOLL)
- SQPOLL runs a kernel thread that picks up submissions, so the app can do I/O without system calls. "By using the submission queue to fill in new submission queue entries and watching for completions on the completion queue, the application can submit and reap I/Os without doing a single system call." (IORING_SETUP_SQPOLL)
- The SQPOLL thread sleeps when idle and must then be woken. "If the kernel thread is idle for more than sq_thread_idle milliseconds, it will set the IORING_SQ_NEED_WAKEUP bit in the flags field of the struct io_sq_ring." (IORING_SETUP_SQPOLL)
- SQPOLL privileges: CAP_SYS_NICE from 5.11, none from 5.13. "5.11 also allows using this as non-root, if the user has the CAP_SYS_NICE capability. In 5.13 this requirement was also relaxed, and no special privileges are needed for SQPOLL in newer kernels." (IORING_SETUP_SQPOLL)
- setup fails with EPERM when the io_uring_disabled sysctl forbids it. "EPERM /proc/sys/kernel/io_uring_disabled has the value 2, or it has the value 1 and the calling process does not hold the CAP_SYS_ADMIN capability or is not a member of /proc/sys/kernel/io_uring_group." (ERRORS)
- By default io_uring interrupts a running task when a completion arrives; COOP_TASKRUN (5.19) avoids that. "By default, io_uring will interrupt a task running in userspace when a completion event comes in." (IORING_SETUP_COOP_TASKRUN)

## Visuals worth redrawing

None.

## My notes

- Every flag lists "Available since" a kernel version; useful for pinning
  claims to versions.
