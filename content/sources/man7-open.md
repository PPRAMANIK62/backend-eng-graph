---
id: man7-open
title: open(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/open.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for open (man-pages 6.19). Used here for three flags:
O_DIRECT (bypass the page cache, with alignment rules), and O_SYNC and
O_DSYNC (make each write durable before it returns).

## Key claims

- O_DIRECT tries to avoid the page cache; I/O goes straight to and from user buffers. "File I/O is done directly to/from user-space buffers." (O_DIRECT)
- It usually makes things slower, and is meant for programs that cache for themselves. "In general this will degrade performance, but it is useful in special situations, such as when applications do their own caching." (O_DIRECT)
- O_DIRECT alone doesn't promise durability; add O_SYNC for that. "To guarantee synchronous I/O, O_SYNC must be used in addition to O_DIRECT." (O_DIRECT)
- O_DIRECT has been in Linux since 2.4.10. "O_DIRECT (since Linux 2.4.10)" (O_DIRECT heading)
- Alignment rules for buffer address, length and file offset vary by filesystem and kernel, and may be absent. "In Linux alignment restrictions vary by filesystem and kernel version and might be absent entirely." (NOTES, O_DIRECT)
- Misaligned O_DIRECT I/O either fails with EINVAL or silently falls back to buffered I/O. "they can either fail with EINVAL or fall back to buffered I/O." (NOTES, O_DIRECT)
- Since Linux 6.1, statx(2) with STATX_DIOALIGN reports a file's O_DIRECT support and alignment. "Since Linux 6.1, O_DIRECT support and alignment restrictions for a file can be queried using statx(2), using the STATX_DIOALIGN flag." (NOTES, O_DIRECT)
- Historic rules: Linux 2.4 needed filesystem-block alignment (typically 4096 bytes); 2.6.0 relaxed it to the logical block size (typically 512 bytes). "In Linux 2.6.0, this was relaxed to the logical block size of the block device (typically 512 bytes)." (NOTES, O_DIRECT)
- Don't mix O_DIRECT with buffered I/O or mmap on the same file. "Applications should avoid mixing O_DIRECT and normal I/O to the same file" (NOTES, O_DIRECT)
- O_DIRECT I/O into private memory shouldn't run while fork(2) happens, or data can be corrupted. "O_DIRECT I/Os should never be run concurrently with the fork(2) system call, if the memory buffer is a private mapping" (NOTES, O_DIRECT)
- O_DIRECT came from SGI IRIX. "The O_DIRECT flag was introduced in SGI IRIX" (NOTES, O_DIRECT)
- O_DSYNC: each write returns only after data and the metadata needed to read it are on the hardware, like write plus fdatasync. "as though each write(2) was followed by a call to fdatasync(2)" (O_DSYNC)
- O_SYNC: same with all file metadata, like write plus fsync. "as though each write(2) was followed by a call to fsync(2)" (O_SYNC)
- (added for file-descriptor) A file descriptor is a small integer indexing the process's own table. "a small, nonnegative integer that is an index to an entry in the process's table of open file descriptors" (DESCRIPTION)
- open() returns the lowest free number. "The file descriptor returned by a successful call will be the lowest-numbered file descriptor not currently open for the process." (DESCRIPTION)
- By default an fd stays open across execve; O_CLOEXEC changes that. "By default, the new file descriptor is set to remain open across an execve(2)" (DESCRIPTION)
- open() creates an open file description in a system-wide table, holding the offset and status flags. "A call to open() creates a new open file description, an entry in the system-wide table of open files." (DESCRIPTION)
- The fd keeps pointing at the open file even if the path is removed or changed. "this reference is unaffected if path is subsequently removed or modified to refer to a different file" (DESCRIPTION)
- dup(2) gives a second fd on the same open file description, so they share the offset. "the two file descriptors consequently share the file offset and file status flags" (NOTES, Open file descriptions)
- fork(2) children inherit duplicates that share the parent's open file descriptions. "a child process created via fork(2) inherits duplicates of its parent's file descriptors" (NOTES, Open file descriptions)
- Each open() of the same file makes a new, separate open file description. "Each open() of a file creates a new open file description" (NOTES, Open file descriptions)
- The kernel calls an open file description a struct file. "or—in kernel-developer parlance—a struct file." (NOTES, Open file descriptions)
- O_CLOEXEC (since 2.6.23) avoids a race where another thread's fork plus execve leaks the fd. "the race may lead to the file descriptor returned by open() being unintentionally leaked to the program executed by the child process" (O_CLOEXEC)
- Signal-driven I/O on an fd works for terminals, sockets, pipes and FIFOs, so fds refer to all of these. "This feature is available only for terminals, pseudoterminals, sockets, and (since Linux 2.6) pipes and FIFOs." (O_ASYNC)
- EMFILE: per-process fd limit reached. "The per-process limit on the number of open file descriptors has been reached" (ERRORS)
- ENFILE: system-wide limit reached. "The system-wide limit on the total number of open files has been reached." (ERRORS)
- (added in review) Setting FD_CLOEXEC later with fcntl isn't enough in threaded programs. "using a separate fcntl(2) F_SETFD operation to set the FD_CLOEXEC flag does not suffice to avoid race conditions" (O_CLOEXEC)
- (added in review) The logical block size can be read with blockdev. "from the shell using the command: blockdev --getss" (NOTES, O_DIRECT)
- (added in review) Mixing O_DIRECT and buffered I/O is slower even when correct. "Even when the filesystem correctly handles the coherency issues in this situation, overall I/O throughput is likely to be slower than using either mode alone." (NOTES, O_DIRECT)
- (added in review) Private mappings include the heap and static buffers. "this includes memory allocated on the heap and statically allocated buffers" (NOTES, O_DIRECT)

## Visuals worth redrawing

None.

## My notes

- Linus Torvalds's famous 2002 criticism of O_DIRECT used to be quoted
  here; it's not on the 6.19 page (grepped). Use
  torvalds-o-direct-2002 for it.
