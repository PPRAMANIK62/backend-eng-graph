---
id: lwn-atomic-writes-without-tears
title: Atomic writes without tears
author: Jake Edge (LWN.net)
url: https://lwn.net/Articles/974578/
published: 2024-05-24
accessed: 2026-09-28
kind: blog
primary: false
---

## Summary

LWN report on a 2024 LSFMM+BPF session led by John Garry and Ted Ts'o on
untorn writes. Why databases want them (to stop writing every page
twice), how NVMe and SCSI provide atomicity, the `RWF_ATOMIC` API
proposal, and the harder buffered-I/O case PostgreSQL needs.

## Key claims

- MySQL and PostgreSQL write chunks up to 16KB, larger than the usual 4KB block. "MySQL and PostgreSQL both use larger chunks, up to 16KB." (Garry's overview)
- PostgreSQL uses 16KB buffered I/O and does extra work to keep data safe. "The goal is to help PostgreSQL, which writes its data using 16KB buffered I/O; it currently has to do a lot of extra work to ensure that its data is safe on disk." (intro)
- An untorn-write promise would let databases skip double writes. "A promise of non-torn, 16KB buffered writes would allow the database to avoid doing double writes." (intro)
- The kernel didn't guarantee atomic 16KB writes, even with direct I/O (as of May 2024). "The kernel does not guarantee atomic 16KB writes, even for direct I/O, however." (Garry's overview)
- NVMe has no atomic write command; writes under the device limit that don't cross a boundary are atomic. "NVMe implicitly does atomic writes; there is no dedicated command to request them." (Hardware)
- Cloud vendors already sell torn-write protection for MySQL, with "sharp edges". "there are \"lots of sharp edges\"" (Hardware / Ts'o)
- Skipping the double write can give MySQL a 60–100% gain (Ts'o's figure). "The feature can provide a 60-100% improvement in database performance, he said, because MySQL can avoid doing a double write" (Hardware)
- Claim in discussion that NVMe has 16KB tear boundaries. "Matthew Wilcox noted that NVMe is specified to have 16KB tear boundaries" (Hardware)
- The word "atomic" comes from the hardware vendors; the goal is "untorn writes". "the term \"atomic\" is used for the feature, because that is what the hardware vendors call it, but that it is providing the \"untorn writes\" that database developers want." (Hardware)

## Visuals worth redrawing

None.

## My notes

- Reporting on a discussion; the 60–100% figure is a spoken claim, not a
  measurement write-up. The "16KB tear boundaries" remark conflicts with
  the NVMe spec, where the atomic size is per device (AWUPF).
- Written before RWF_ATOMIC merged (6.11, per the pwritev2 man page).
