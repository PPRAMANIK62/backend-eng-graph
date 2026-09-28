---
id: 0003-what-my-ssd-reports-to-the-kernel
title: What does my SSD tell the kernel about caching, flushes and atomic writes?
phase: 1
component: lab/microbench
date: 2026-09-28
---

## Question

Does this machine's drive have a volatile write cache, does it support
FUA, does it advertise atomic writes bigger than a sector, and does TRIM
reach it through LUKS? The [[fsync]], [[torn-writes]] and
[[ssd-internals]] articles need to know, and WD's product brief for the
drive doesn't say.

## Setup

- Machine as in experiment 0001 (`0001-latency-numbers-on-my-laptop.md`):
  Linux 7.1.9-arch1-2, one WD PC SN740 512 GB NVMe
  (`SDDQNQD-512G-1014`, firmware `73101100`). Root and home are btrfs on
  a dm-crypt (LUKS) device, `dm-0`, on top of `nvme0n1`.
- Read on 2026-09-28, no root needed:
  `cd /sys/block/nvme0n1/queue && for f in logical_block_size physical_block_size minimum_io_size write_cache fua atomic_write_max_bytes atomic_write_unit_min_bytes atomic_write_unit_max_bytes atomic_write_boundary_bytes discard_granularity discard_max_bytes scheduler; do echo "$f = $(cat $f)"; done`
  and the same for `discard_max_bytes`, `discard_max_hw_bytes`,
  `write_cache`, `fua` and `atomic_write_max_bytes` under
  `/sys/block/dm-0/queue/`.
- `nvme-cli` isn't installed, so the drive's own identify fields (AWUN,
  AWUPF, VWC) weren't read directly. This is what the kernel concluded
  from them.

## Harness

None. This reads what the kernel reports; it doesn't test the drive's
behavior.

## Results

| Attribute | `nvme0n1` (the drive) | `dm-0` (LUKS on top) |
|---|---|---|
| `logical_block_size` | 512 | not read |
| `physical_block_size` | 512 | not read |
| `write_cache` | write back | write back |
| `fua` | 1 | 1 |
| `atomic_write_max_bytes` | 0 | 0 |
| `atomic_write_unit_min_bytes` | 0 | not read |
| `atomic_write_unit_max_bytes` | 0 | not read |
| `discard_max_bytes` | 2199023255040 | 0 |
| `discard_max_hw_bytes` | not read | 0 |
| `scheduler` | `[none]` mq-deadline kyber bfq | not read |

## What it means

- The drive has a volatile write-back cache, and the driver supports FUA
  writes, which skip that cache. So a write isn't safe from power loss
  until the kernel sends a flush or a FUA write, which is what [[fsync]]
  asks for.
- The kernel reports an atomic write size of 0 for this drive. I read
  that as "no multi-sector atomic writes through `RWF_ATOMIC` here", but
  the kernel's ABI docs don't say what 0 means, so that's my reading. The
  only safe assumption for the phase 1 log is that a 512-byte sector is
  the most that lands whole, and that [[torn-writes]] can happen above
  that. Checking would need an `RWF_ATOMIC` write to the raw device,
  which needs root and a scratch area.
- The drive accepts discards (TRIM), but `dm-0` reports
  `discard_max_hw_bytes` of 0, which the kernel docs say means no
  discard support. With this LUKS setup, TRIM from btrfs never reaches
  the SSD.
- No I/O scheduler runs in front of the NVMe drive (`none`).
