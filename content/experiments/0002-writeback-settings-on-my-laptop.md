---
id: 0002-writeback-settings-on-my-laptop
title: When does this machine start writing dirty pages to disk?
phase: 1
component: lab/microbench
---

## Question

The [[page-cache]] holds written data in RAM as dirty pages and writes
it out later. How much dirty data does this machine allow, and how old
can it get, before the kernel writes it back? The kernel docs explain
the knobs but don't give defaults I could check, so I read the values
off the machine instead.

## Setup

- Same machine as experiment 0001
  (`0001-latency-numbers-on-my-laptop.md`): i5-13500H,
  16 GB RAM, Linux 7.1.9-arch1-2, Arch with Omarchy.
- Command:
  `cd /proc/sys/vm && for f in dirty_ratio dirty_bytes dirty_background_ratio dirty_background_bytes dirty_expire_centisecs dirty_writeback_centisecs; do echo "$f = $(cat $f)"; done`
- Raw output: `lab/microbench/data/run-1/vm-writeback.txt`.

## Harness

None. This reads settings; it doesn't measure behavior.

## Results

| Setting | Value | Meaning |
|---|---|---|
| `dirty_ratio` | 0 | unused, because `dirty_bytes` is set |
| `dirty_bytes` | 268435456 (256 MiB) | past this, a process that writes has to do writeback itself |
| `dirty_background_ratio` | 0 | unused, because `dirty_background_bytes` is set |
| `dirty_background_bytes` | 67108864 (64 MiB) | past this, background flusher threads start writing |
| `dirty_expire_centisecs` | 3000 (30 s) | dirty data older than this gets written at the next flusher run |
| `dirty_writeback_centisecs` | 1500 (15 s) | how often the flusher threads wake up |

## What it means

On this machine a program can write up to 64 MiB that exists only in
RAM before the kernel starts writing it out in the background, and data
can sit dirty for up to about 45 seconds (30 s to expire, plus up to
15 s until the flusher wakes). A power cut in that window loses it
unless the program called [[fsync]]. Someone set these as byte limits
rather than ratios; I didn't find out whether Arch or Omarchy did. Next:
watch `Dirty:` in `/proc/meminfo` during a large write to see the
limits act.
