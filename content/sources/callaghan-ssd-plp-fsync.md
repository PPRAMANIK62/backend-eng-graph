---
id: callaghan-ssd-plp-fsync
title: SSDs, power loss protection and fsync latency
author: Mark Callaghan
url: http://smalldatum.blogspot.com/2026/01/ssds-power-loss-protection-and-fsync.html
kind: blog
primary: true
---

## Summary

A database performance engineer measures fsync and fdatasync latency
after O_DIRECT writes with fio, on consumer SSDs, enterprise SSDs with
power loss protection (PLP), and Google Cloud storage. Main result:
without PLP, writes are fast and fsync is slow. These are his machines
and drives, not general numbers.

## Key claims

- The main claim. "For an SSD without power loss protection, writes are fast but fsync is slow." (intro)
- Setup: fio, files opened with O_DIRECT, an fsync or fdatasync per write, 16 KB and 2 MB writes, 5-minute runs, Ubuntu 24.04, mostly ext4; shared results are for 1 fio job. (Results from fio)
- fsync latency after 16 KB writes, µs: Crucial T500 (consumer) 891.1, Samsung 990 Pro (consumer) 2974.2, Intel D7-P5520 (datacenter) 12.4, Samsung PM-9a3 (enterprise, PLP) 1.6. (Results: overview table, columns dell, ser7, hetz, socket2)
- fdatasync after 16 KB writes, µs: 447.4, 2783.2, 9.8, 0.7 for the same four. (same table)
- On the T500 server, 16 KB writes went from 43,400 writes/s with no sync to 1,083 writes/s with an fsync per write. (Results: dell)
- Enterprise SSDs with PLP can make data loss on power failure unlikely; consumer SSDs mostly lack it. "Some SSDs, especially those marketed as enterprise SSDs, have a feature called power loss protection that make data loss unlikely." (Power loss protection)
- PLP needs extra hardware such as a capacitor, which is why enterprise drives are often larger. "more room is needed for the capacitor or other HW that provides the power loss protection" (Power loss protection)
- The T500 is claimed online to have PLP but still showed almost 1 ms fsync. "While the web claims it has PLP via capacitors the fsync latency for it was almost 1 millisecond." (Results from fio, dell)
- (added for ssd-internals) Most SSDs buffer small writes in RAM on the drive, which risks loss on power failure. "one way to achieve speed is to buffer those writes in RAM on the SSD while waiting for enough data to be written to an extent." (Power loss protection)
- Some consumer SSDs only promise a best effort to flush on power loss. "some of the consumer SSDs claim to make a best effort to flush writes from the write buffer on power loss." (Power loss protection)
- His advice: use an enterprise SSD if you can, else measure. "use an enterprise SSD if possible, if not run tests to understand fsync and fdatasync latency" (tl;dr)
- (added in review) Most SSDs have a write buffer. "most SSDs have a write-buffer that makes small writes fast." (Power loss protection)
- (added in review) The hetz server is two Intel D7-P5520s in software RAID 1; PLP for them is what "the web claims". "Intel D7-P5520 (now Solidigm). These are datacenter SSDs and the web claims they have power loss protection." (Hardware, hetz)

## Visuals worth redrawing

- A bar chart of fsync latency per drive (log scale) from his table,
  credited.

## My notes

- He says he's "far from an expert" on PLP; treat the mechanism
  explanation as his understanding, the latency numbers as measurements.
- No power-cut test here; this is about speed, not whether flushes are
  honored.
