---
id: kernel-blk-mq
title: Multi-Queue Block IO Queueing Mechanism (blk-mq)
author: Linux kernel documentation
url: https://docs.kernel.org/block/blk-mq.html
published: unknown
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

How Linux's block layer queues I/O requests between filesystems and the
device driver. The old design had one queue and one lock, built for hard
disks. blk-mq gives each CPU its own software queue and maps those onto
the device's hardware queues, so fast SSDs can take many requests at once.

## Key claims

- blk-mq exists so fast devices can take many requests in parallel. "an API to enable fast storage devices to achieve a huge number of input/output operations per second (IOPS)" (Introduction)
- With SSDs the slow part moved from the device to the OS. "the bottleneck of the stack had moved from the storage device to the operating system." (Background)
- The old block layer had one queue with one lock. "The former design had a single queue to store block IO requests with a single lock." (Background)
- blk-mq uses per-CPU entry points instead. "the blk-mq API spawns multiple queues with individual entry points local to the CPU, removing the need for a lock." (Background)
- It sits between user space (and any filesystem) and the device driver. "acting as middleware between the userspace (and a file system, if present) and the block device driver." (Operation)
- Two kinds of queue: software staging queues and hardware dispatch queues. "blk-mq has two group of queues: software staging queues and hardware dispatch queues." (Operation)
- A request goes straight to the hardware queue unless a scheduler is attached or merging is wanted. "if there's an IO scheduler attached at the layer or if we want to try to merge requests." (Operation)
- Staging queues merge requests for adjacent sectors. "requests for sector 3-6, 6-7, 7-9 can become one request for 3-9." (Software staging queues)
- A request is built from one or more bios. "A request is one or more BIOs." (Software staging queues)
- The "none" scheduler does no reordering. "It will just place requests on whatever software queue the process is running on, without any reordering." (Software staging queues)
- Hardware queues map to the device's submission queues. "used by device drivers to map the device submission queues (or device DMA ring buffer)" (Hardware dispatch queues)
- Number of hardware queues is capped by the core count. "it will not be more than the number of cores of the system." (Hardware dispatch queues)
- Completion order is not guaranteed. "Neither the block layer nor the device protocols guarantee the order of completion of requests." (Hardware dispatch queues)
- Each request carries an integer tag used to match its completion. "every request is identified by an integer, ranging from 0 to the dispatch queue size." (Tag-based completion)
- (added in review) Staging queues are per CPU or per node. "the number of queues is defined by a per-CPU or per-node basis." (Software staging queues)
- (added in review) The old design ordered requests around the disk head. "ordering read/write requests according to the current position of the hard disk head." (Background)

## Visuals worth redrawing

- The two-level queue picture: per-CPU software queues feeding a smaller
  number of hardware queues, then the device.

## My notes

- Further reading on the page points to the paper "Linux Block IO:
  Introducing Multi-queue SSD Access on Multi-core Systems"; not opened.
