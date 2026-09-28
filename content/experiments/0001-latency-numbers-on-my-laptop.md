---
id: 0001-latency-numbers-on-my-laptop
title: How long do basic operations take on my laptop?
phase: 1
component: lab/microbench
date: 2026-09-28
---

## Question

How long does a cache hit, a RAM read, a system call, a context switch, a
4 KiB SSD read and a network round trip take on the machine the lab runs
on? The [[latency-numbers]] article needs numbers that came from a run,
not from a table copied off the internet. I expected each level of the
[[memory-hierarchy]] to be several times slower than the one above it,
and the SSD and network to be thousands of times slower than RAM.

## Setup

- Machine: laptop, 13th Gen Intel Core i5-13500H (16 CPUs: CPUs 0–7 are
  4 P-cores with 2 threads each, 8–15 are E-cores), `lscpu` reports L1d
  448 KiB (12 instances), L2 9 MiB (6 instances), L3 18 MiB (1 instance).
  16 GB RAM. CPU frequency governor `powersave`.
- Kernel: Linux 7.1.9-arch1-2, `PREEMPT_DYNAMIC`.
- Disk: WD PC SN740 512 GB NVMe (`SDDQNQD-512G-1014`), 512-byte logical
  and physical sectors, write cache reported as "write back".
- Filesystem: btrfs over LUKS (dm-crypt), mounted
  `compress=zstd:3,ssd,space_cache=v2`. The SSD test file had
  compression turned off with `chattr +m`.
- Network: Wi-Fi to a home router, then the ISP. Machine is in India
  (timezone +05:30).
- Compiler: gcc 16.2.1, `-O2`.
- Code: `lab/microbench/latency.c`, driven by `lab/microbench/run.sh`,
  summarized by `lab/microbench/summarize.py`.
- Command: `lab/microbench/run.sh`, then
  `python3 lab/microbench/summarize.py lab/microbench/data/2026-09-28`.
- Every CPU test pinned to CPU 2 with `taskset -c 2`.

What each test does:

- **chase:** a random cycle of 64-byte nodes, one per cache line. Each
  load's address comes from the load before it, so loads can't overlap
  and the prefetcher can't guess. 50 million loads per run, 11 runs per
  working-set size. The result is the average time per load in a run.
  Pages are 4 KiB, so large working sets also pay for TLB misses.
- **memread:** add up every 8-byte word of a buffer, front to back.
- **syscall:** 10 million `getppid()` calls through `syscall()`, 11 runs.
- **ctxswitch:** two processes on the same CPU pass one byte back and
  forth over two pipes, 1 million round trips, 11 runs. One round trip
  is two context switches plus two `write` and two `read` calls.
- **ssdread:** 20,000 random 4 KiB `pread` calls with `O_DIRECT` on a
  2 GiB file of random bytes, each timed on its own. This goes through
  btrfs (with its checksums) and dm-crypt decryption, not the bare drive.
- **network:** 50 pings to the home router. Then 11 TCP connections to
  each AWS DynamoDB regional endpoint
  (`https://dynamodb.<region>.amazonaws.com/`), timing only the
  handshake (`time_connect - time_namelookup` in curl), which is one
  round trip. ICMP to these endpoints is blocked. I assume each endpoint
  answers from inside the region it's named for; I didn't verify that.

## Harness

None. This is a measurement, not a correctness test. Sanity checks: the
chase loop prints the final pointer so the compiler can't delete it, and
the shape of the chase curve should step up near each cache size.

## Results

Raw data: `lab/microbench/data/2026-09-28/` (machine details in
`machine.txt`).

**Dependent loads (chase)**, ns per load, median of 11 runs (min–max):

| Working set | ns per load | Where it mostly lives |
|---|---|---|
| 16 KiB | 1.09 (1.08–1.29) | L1 |
| 32 KiB | 1.26 (1.24–1.27) | L1 |
| 256 KiB | 3.77 (3.75–3.80) | L2 |
| 1 MiB | 6.08 (5.57–6.45) | L2 |
| 2 MiB | 11.53 (11.25–13.68) | L3 |
| 8 MiB | 18.82 (17.11–20.55) | L3 |
| 16 MiB | 48.03 (43.72–52.26) | partly L3, partly RAM |
| 64 MiB | 104.17 (103.60–104.86) | RAM |
| 256 MiB | 113.01 (111.95–147.33) | RAM |
| 1 GiB | 125.19 (121.27–198.40) | RAM, more TLB misses |

The "where it lives" column is my reading of the step changes against
the cache sizes `lscpu` reports, not something the test measured.

**Sequential read from RAM (memread)**, median of 10 reps (the first rep
dropped):

| Size | Time | Rate |
|---|---|---|
| 1 MiB | 28.4 µs (28.0–32.0) | 37.0 GB/s |
| 256 MiB | 14,669 µs (14,562–15,602) | 18.3 GB/s |

**Kernel crossings**, median of 11 runs (min–max):

| Test | ns |
|---|---|
| `getppid()` system call | 64.0 (63.8–64.2) |
| pipe round trip between two processes on one CPU | 1,698 (1,685–1,705) |

**Random 4 KiB read with `O_DIRECT`** (20,000 reads): p50 49.8 µs,
p99 90.3 µs, p99.9 248.9 µs, max 1,786 µs.

**Network round trips:**

| Target | p50 | min | max | n |
|---|---|---|---|---|
| home router (ping) | avg 3.99 ms | 1.70 ms | 32.9 ms | 50 |
| ap-south-1 (Mumbai) | 76.5 ms | 67.4 | 81.3 | 11 |
| ap-southeast-1 (Singapore) | 107.7 ms | 87.0 | 120.7 | 11 |
| eu-west-1 (Ireland) | 212.3 ms | 197.5 | 240.2 | 11 |
| us-west-2 (Oregon) | 295.0 ms | 284.0 | 305.6 | 11 |
| us-east-1 (Virginia) | 318.9 ms | 304.0 | 409.6 | 11 |
| sa-east-1 (São Paulo) | 395.2 ms | 382.2 | 436.1 | 11 |

ping only printed min/avg/max/mdev, so the router row has an average,
not a median.

## What it means

- Each cache level is a clear step: about 1 ns in L1, 4–6 ns in L2,
  12–19 ns in L3, and 104–125 ns once the working set is far past the
  18 MiB L3. A RAM access that misses every cache costs about 100 L1 hits.
- A random 4 KiB SSD read at the median (49.8 µs) costs about 400 RAM
  misses. Its p99.9 is five times its median.
- A system call that does almost nothing costs 64 ns here, about half a
  RAM miss. A pipe round trip that forces two [[context-switch|context
  switches]] costs about 1.7 µs, so one switch plus one read and one
  write is under 1 µs. This test doesn't separate the switch from the
  pipe work.
- The router is 1.7 ms away over Wi-Fi at best, with a 33 ms worst case.
  That's slower than the SSD's p99.9. Round trips to other continents
  cost 200–400 ms from this location, and none of that is the server's
  work.
- Next: the fsync benchmark (phase 1 build) adds the write side, and
  reruns on ext4 in a loop device would show what btrfs and dm-crypt
  add to the SSD read.
