---
id: zero-copy
title: Zero-copy
depth: short
phase: 10
note: >-
  Sending file bytes to a socket without copying them through the
  program: sendfile, and why log brokers lean on it.
needs: [page-cache, system-call]
leads_to: []
compare_with: [mmap, io-uring]
---

# Zero-copy

The usual way to send a file over the network is to read a chunk into
your program's buffer and write that buffer to a socket. Zero-copy
means handing the whole job to the kernel: with `sendfile`, file bytes
go from the page cache to the socket without ever passing through your
program. Log brokers lean on it, because most of what they send is
bytes read straight off disk, unchanged.

## The ordinary path: four copies

Take a broker answering a fetch with a read-then-write loop. For every
chunk:

1. The kernel reads the data from disk into the [[page-cache]].
2. `read` copies it from the page cache into your buffer in user
   space.
3. `write` copies it from your buffer into the socket's buffer in the
   kernel.
4. The kernel copies it from the socket buffer to the network card.

That's four copies and two [[system-call|system calls]], and your
program never looks at the bytes. It just carries them from one
kernel buffer to another.

## sendfile: let the kernel do it

```c
ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);
```

You pass the socket, the file, where to start and how much to send.
The copy happens inside the kernel, from the page cache to the socket.
In the path Kafka describes, only the last copy, to the network card's
buffer, is left. The hardware was ready for this: network cards have
long been able to gather a packet from several places in memory.

![Two paths from a file on disk to the network card. Top, read and write: disk to page cache, page cache to a user-space buffer (read), user-space buffer to the socket buffer (write), socket buffer to the network card: four copies and two system calls, two of the copies crossing into user space and back. Bottom, sendfile: disk to page cache, then page cache straight to the network card, one system call, nothing crossing into user space.](img/zero-copy-paths.svg)

*Where the bytes go with read and write, and with sendfile. Adapted from the Kafka 4.3 design docs (Efficiency), which describe the path in text.*

A few details of Linux's `sendfile(2)` worth knowing:

- The input has to be a file that supports mmap-like access, not a
  socket.
- With an `offset` pointer, it reads from that position and leaves the
  file's own offset alone.
- It can send fewer bytes than you asked for, so call it in a loop.
  One call moves at most 0x7ffff000 bytes (just under 2 GiB).
- To put a header in front of the file data in the same packets, use
  `TCP_CORK` (see [[nagle-and-delayed-ack]]).
- It's Linux-specific. Other Unix systems have a `sendfile` with
  different rules. If it fails with `EINVAL` or `ENOSYS`, fall back to
  read and write.

## Why log brokers love it

Kafka uses one binary format for producers, brokers, consumers and
the files on disk. A fetch response is then just a byte range of a
segment file: find the start position through the [[log-segments]]
index, and `sendfile` from there. Batches even stay compressed the
whole way, from producer to disk to consumer.

Two more things follow. Data enters the page cache once and every
consumer that reads it is served from there. And when consumers are
caught up, what they fetch is still in the cache, so the disks see no
reads at all.

## What breaks it

**Encryption.** TLS has to change every byte before it goes out. With
a TLS library in user space, the data has to come up into your program
to be encrypted, and the zero-copy path is gone. Kafka 4.3 doesn't use
`sendfile` when SSL is on. Linux's kernel TLS brings it back: after the
[[tls|TLS]] handshake, the library hands the keys to the kernel, which
encrypts data sent with `sendfile` itself. With a network card that
does TLS offload, there's not even a copy inside the kernel.

**Data that isn't a file.** A rendered template, a JSON response you
just built: `sendfile` can't help. Linux's `MSG_ZEROCOPY` flag on
`send` avoids copying a user buffer, but you must not touch the buffer
until the kernel says it's done. The setup costs enough that it only
pays for large sends. In the patch author's own tests, a netperf
benchmark ran 39% faster and a production workload 5–8%.

**Changing the file mid-send.** With `sendfile` or `splice`, the
network stack reads the page cache pages themselves. If you write to
that part of the file before it's sent, the new bytes may go out, and
nothing tells you when it's safe to write again. A log is a good fit
here: the bytes before the end are never rewritten.

## Where it gets tricky

**"Zero" isn't zero.** The copy to the card still happens. If the card
can't compute [[checksums]], the kernel reads through the data anyway, and
any transformation, such as encryption, forces a copy.

**The gains often disappoint.** Copying memory is fast, and avoiding a
copy has setup costs of its own. Measure your workload first.

**It's not [[mmap]].** Mapping a file lets your program read the page
cache pages without a `read` copy. That helps when your program needs
to look at the bytes. `sendfile` is for when it doesn't.

**`splice` is the general version,** moving data between any file
descriptor and a pipe, and it has the same mid-send problem. Kernel
developers have discussed [[io-uring]] as a better interface, since
it can tell you when a buffer is free.

## What this means when you build

- Store data on disk in the format you send it in, or you can't use
  `sendfile`.
- Loop on short sends, and handle `EAGAIN` on a
  [[non-blocking-io|non-blocking]] socket.
- Never modify file ranges that might still be in flight.
- Plan for TLS: either kernel TLS or no zero-copy.

## Further reading

- [Kafka design](https://kafka.apache.org/43/design/design/), Apache Kafka 4.3 docs. The Persistence and Efficiency sections: the page-cache design, the four-copy path, sendfile, and no sendfile with SSL.
- [sendfile(2)](https://man7.org/linux/man-pages/man2/sendfile.2.html), Linux man-pages 6.19. The call itself: arguments, short writes, limits, and the rule about modifying the file.
- [Zero-copy networking](https://lwn.net/Articles/726917/), Jonathan Corbet, LWN, 2017. What sendfile can't do, MSG_ZEROCOPY, and why the gains are smaller than hoped.
- [Rethinking splice()](https://lwn.net/Articles/923237/), Jonathan Corbet, LWN, 2023. What happens when a file changes while its pages are being sent.
- [Kernel TLS](https://docs.kernel.org/networking/tls.html), Linux kernel docs. sendfile over kernel TLS, and true zero-copy with device offload.
