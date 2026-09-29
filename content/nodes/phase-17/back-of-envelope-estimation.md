---
id: back-of-envelope-estimation
title: Back-of-the-envelope estimation
depth: short
phase: 17
note: >-
  Rough math on traffic, storage and bandwidth to rule designs in or
  out.
needs: [latency-numbers, littles-law]
leads_to: [system-design-method]
compare_with: [capacity-planning]
---

# Back-of-the-envelope estimation

A back-of-the-envelope estimate is a few lines of rough arithmetic that
tell you how much traffic, storage, bandwidth and hardware a design
needs, before anyone draws a box. You're after the right order of
magnitude, not the right number. That's enough to rule out designs that
can't work and to find the part of the system that will break first.

## One example, start to finish

Google's SRE workbook walks through a real one: a dashboard that shows
advertisers the click-through rate of each ad. The inputs are
assumptions, written down up front:

- 500,000 search queries a second, and 10,000 ad clicks a second.
- Each query log entry is treated as 2 KB. The real fields add up to
  less; the authors round up on purpose so they don't hit a limit
  early.

Now multiply, keeping the powers of ten and the units:

(5 × 10⁵ queries/s) × (8.64 × 10⁴ s/day) × (2 × 10³ bytes) = 86.4 TB a day

They round that up to 100 TB, to leave room for indexes and the smaller
click log. Three lines, and the question has changed. It's no longer
"which database?" but "can one machine even do this?"

It can't, and the arithmetic shows why in two more lines. If each log
entry costs one disk write and an HDD sustains about 200 operations a
second (their assumption), you need 5 × 10⁵ ÷ 200 = 2,500 disks just to
keep up. The problem is operations per second, not space. Holding 100 TB
in RAM instead, on machines with 64 GB each, takes about 1,563 machines.
Either way the design has to spread across many machines, and you know
that before you've written any code.

The reasoning and the assumptions matter more than the final numbers.
Several imperfect but reasonable estimates beat none.

## The habits that make it work

- **Write down every assumption.** "2 KB per entry" and "200 IOPS per
  disk" are guesses. Written down, anyone can challenge them and redo
  the sum.
- **Keep the units.** They catch mistakes: if the answer comes out in
  bytes per request when you wanted bytes per day, a step is missing.
- **Use powers of ten.** Write 5 × 10⁵, not 500,000. A day is
  8.64 × 10⁴ seconds, call it 10⁵. You're trying to get the exponent
  right; the digit in front matters much less.
- **Break the unknown into guessable pieces.** You can't guess "the
  cost of our logs", but you can guess the size of a log line, the
  lines per second, and the price per gigabyte. This is called Fermi
  decomposition.
- **Keep it short.** If the estimate needs more than about six
  assumptions, it's probably more complicated than it needs to be.

The numbers you plug in come from a table like
[[latency-numbers|the latency numbers]]: how long a disk read, a
same-region round trip or a memory access takes, and how much data
each can move per second.

## A second example: what do the logs cost?

Say a service handles 100,000 requests a second and writes one log line
per request. Guess 500 bytes per line (our assumption; measure yours).

- Bytes per second: 10⁵ × 500 = 5 × 10⁷, so 50 MB/s.
- Per day: 5 × 10⁷ × 8.64 × 10⁴ ≈ 4.3 × 10¹², about 4 TB.

Now the price decides the design. One set of rounded cloud prices puts
blob storage at about $0.02 per GB per month, and hosted logs at about
$0.50 per GB, which it calls typical for a few logging providers.
Keeping 30 days in blob storage is about 130 TB, or roughly $2,600 a
month. If the logging service charges its $0.50 for each GB you send,
4 TB a day costs about $2,000 **a day**. That gap is a reason to
sample, shorten or tier logs before anything is built.

## Concurrency from rate and latency

Many estimates need to know how much is in flight at once: threads,
connections, open requests. That comes from [[littles-law]]: in flight
= arrival rate × time each one takes. At 2,000 requests a second and
50 ms each (made-up numbers), about 100 requests are in progress at any
moment. That's the pool size you plan for, before any headroom.

## Where it gets tricky

**Old numbers.** The table most people remember is Jeff Dean's slide
from 2009, which has no SSD row at all. A measured modern table, such as
the napkin-math one (re-measured in 2026 on a cloud machine and rounded
on purpose), gives different values for some rows. Say which table you
used, and redo an estimate when a decision rests on one row.

**Averages hide peaks.** An estimate from daily totals gives you the
average rate. Traffic has peaks, so decide a peak-to-average factor
explicitly and write it down, instead of hoping the average is enough.

**An estimate isn't a capacity plan.** This is rough math to choose
between designs. Sizing real hardware for a real load, with measured
per-server throughput and headroom for failures, is
[[capacity-planning]].

## What this means when you build

- Before choosing a design, estimate requests per second, bytes stored
  per day, bytes moved per second, and how many operations the busiest
  component must do.
- Write the assumptions next to the result, with units.
- Look for the resource that runs out first. In the SRE example it was
  disk operations, not disk space.

## Further reading

- [The Site Reliability Workbook, chapter 12: Introducing Non-Abstract Large System Design](https://sre.google/workbook/non-abstract-design/), Salim Virji and others, Google, 2018. A full worked example of turning a whiteboard design into disks, RAM and machines.
- [napkin-math](https://github.com/sirupsen/napkin-math), Simon Eskildsen. Techniques for estimating, plus rounded latency, throughput and cloud cost numbers, re-measured in 2026.
- [Designs, Lessons and Advice from Building Large Distributed Systems](https://www.cs.cornell.edu/projects/ladis2009/talks/dean-keynote-ladis2009.pdf), Jeff Dean, 2009. The original "numbers everyone should know" slide and a short estimate built from it.
