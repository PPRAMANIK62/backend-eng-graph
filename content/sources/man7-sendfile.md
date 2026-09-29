---
id: man7-sendfile
title: sendfile(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/sendfile.2.html
kind: docs
primary: true
---

## Summary

The Linux man page for sendfile (man-pages 6.19). It copies bytes from
one file descriptor to another inside the kernel, so a program can
send a file to a socket without reading it into its own memory. Also
covers short writes, the size cap per call, and the rule that the
file must not change until the data is sent.

## Key claims

- The copy happens in the kernel, so it beats read plus write. "Because this copying is done within the kernel, sendfile() is more efficient than the combination of read(2) and write(2), which would require transferring data to and from user space." (DESCRIPTION)
- The input must be a file that supports mmap-like operations, not a socket. "The in_fd argument must correspond to a file which supports mmap(2)-like operations (i.e., it cannot be a socket)." (DESCRIPTION)
- Since Linux 2.6.33 the output can be any file; before, it had to be a socket. "Before Linux 2.6.33, out_fd must refer to a socket.  Since Linux 2.6.33 it can be any file." (DESCRIPTION)
- An offset argument lets you read from a position without moving the file offset. "If offset is not NULL, then sendfile() does not modify the file offset of in_fd" (DESCRIPTION)
- It can send fewer bytes than asked, so loop. "Note that a successful call to sendfile() may write fewer bytes than requested; the caller should be prepared to retry the call if there were unsent bytes." (RETURN VALUE)
- At most about 2 GiB per call. "sendfile() will transfer at most 0x7ffff000 (2,147,479,552) bytes, returning the number of bytes actually transferred." (NOTES)
- Use TCP_CORK to send a header in front of the file. "you will find it useful to employ the TCP_CORK option, described in tcp(7), to minimize the number of packets and to tune performance." (NOTES)
- Fall back to read and write if sendfile isn't available. "Applications may wish to fall back to read(2) and write(2) in the case where sendfile() fails with EINVAL or ENOSYS." (NOTES)
- The file must stay unchanged until the other end has the data. "callers must ensure the transferred portions of the file referred to by in_fd remain unmodified until the reader on the other end of out_fd has consumed the transferred data." (NOTES)
- Linux-only semantics. "Other UNIX systems implement sendfile() with different semantics and prototypes.  It should not be used in portable programs." (VERSIONS)
- Added in Linux 2.2. "Linux 2.2, glibc 2.1." (HISTORY)

- splice is the general tool, as long as one side is a pipe. "The Linux-specific splice(2) call supports transferring data between arbitrary file descriptors provided one (or both) of them is a pipe." (NOTES)
- EAGAIN on a non-blocking descriptor that would block. "Nonblocking I/O has been selected using O_NONBLOCK and the write would block." (ERRORS, EAGAIN)

## Visuals worth redrawing

None.

## My notes

- The page doesn't count copies. The copy count is in the Kafka design
  docs and LWN's zero-copy article.
