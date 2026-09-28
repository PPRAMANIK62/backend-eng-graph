---
id: kernel-writeback-cache-control
title: Explicit volatile write back cache control
author: Linux kernel developers
url: https://docs.kernel.org/block/writeback_cache_control.html
kind: docs
primary: true
---

## Summary

How the Linux block layer makes a drive with a volatile write cache
actually persist data: a cache flush (REQ_PREFLUSH) and Force Unit Access
(REQ_FUA). Filesystems set the flags; the block layer and drivers make
them work on each device.

## Key claims

- Many drives, especially consumer ones, report a write done before it's on non-volatile storage. "the devices signal I/O completion to the operating system before data actually has hit the non-volatile storage." (Introduction)
- So the OS must force data out for fsync, sync and unmount. "it means the operating system needs to force data out to the non-volatile storage when it performs a data integrity operation like fsync, sync or an unmount." (Introduction)
- Two tools: a forced cache flush, and the FUA flag. "These mechanisms are a forced cache flush, and the Force Unit Access (FUA) flag for requests." (Introduction)
- REQ_PREFLUSH makes earlier completed writes durable before this one starts. "This explicitly guarantees that previously completed write requests are on non-volatile storage before the flagged bio starts." (Explicit cache flushes)
- REQ_FUA makes this write report completion only once it's durable. "will make sure that I/O completion for this request is only signaled after the data has been committed to non-volatile storage." (Forced Unit Access)
- Filesystems just set the flags and don't care how the device does it. "Filesystems can simply set the REQ_PREFLUSH and REQ_FUA bits and do not have to worry if the underlying devices need any explicit cache flushing" (Implementation details for filesystems)
- For devices without a volatile cache, the flags are stripped. (Feature settings for block drivers)
- Drivers declare a volatile cache with BLK_FEAT_WRITE_CACHE and FUA support with BLK_FEAT_FUA. (Feature settings for block drivers)
- If the device lacks FUA, the block layer sends a flush after the write. "else a REQ_OP_FLUSH request is sent by the block layer after the completion of the write request" (Implementation details for blk-mq drivers)

## Visuals worth redrawing

- A timeline of write, write, FLUSH, FUA write: easy to draw ourselves.

## My notes

- This is the kernel side. Whether the drive honors the flush is up to
  the drive firmware; nothing here can check that.
