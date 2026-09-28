---
id: nvme-nvm-command-set-1-3
title: NVM Express NVM Command Set Specification, Revision 1.3
author: NVM Express, Inc.
url: https://nvmexpress.org/wp-content/uploads/NVM-Express-NVM-Command-Set-Specification-Revision-1.3-Ratified-2026.07.31.pdf
published: 2026-07-31
accessed: 2026-09-28
kind: spec
primary: true
---

## Summary

The NVMe spec for the ordinary read/write command set (released August
2026). Section 2.1.4 defines what an NVMe drive promises about atomic
writes: AWUN for normal operation, AWUPF for power failure, and optional
atomic boundaries.

## Key claims

- A controller runs each namespace in Single or Multiple Atomicity Mode. "A controller is in either Single Atomicity Mode (refer to section 2.1.4.1) or Multiple Atomicity Mode (refer to section 2.1.4.5) for each attached namespace." (§2.1.4 Atomic Operation)
- The drive reports atomic sizes for normal operation and for power fail in Identify Controller. "the size in logical blocks of the write operation guaranteed to be written atomically under various conditions" (§2.1.4.1)
- Namespace values (NAWUN, NAWUPF) may be larger than the controller baseline, never smaller. "that value shall be greater than or equal to the corresponding baseline value" (§2.1.4.1)
- A drive may define atomic boundaries that an atomic write must not cross (NABSN, NABO, NABSPF). "A controller may support Atomic Boundaries that shall not be crossed by an atomic write operation." (§2.1.4.1)
- AWUN: writes up to this size are atomic with respect to other commands; it says nothing about power failure. "AWUN does not have any applicability to write errors caused by power failure" (§2.1.4.2 / Identify Controller, AWUN)
- AWUPF: the write size guaranteed atomic during a power fail or error. "This field indicates the size of the write operation guaranteed to be written atomically to the NVM across all namespaces with any supported namespace format during a power fail or error condition." (Identify Controller, AWUPF)
- AWUPF is in logical blocks and 0's based (0 means one block), and must be ≤ AWUN. "This field is specified in logical blocks and is a 0’s based value. The AWUPF value shall be less than or equal to the AWUN value." (Identify Controller, AWUPF)
- If a write ≤ AWUPF fails, later reads return the previous data. "If the write size is less than or equal to the AWUPF value and the write command fails, then subsequent read commands for the associated logical blocks shall return data from the previous successful write command." (Identify Controller, AWUPF)
- Bigger than AWUPF: no guarantee about what reads return. "If a write command is submitted that has a size greater than the AWUPF value, then there is no guarantee of data returned on subsequent reads of the associated logical blocks." (Identify Controller, AWUPF)
- There's no special atomic write command; atomicity is by size. (implied by §2.1.4; see also lwn-atomic-writes-without-tears)

## Visuals worth redrawing

- Figure 4 (Atomicity Parameters for Single Atomicity Mode): how AWUN,
  AWUPF, NAWUN, NAWUPF and the boundary sizes must relate.

## My notes

- Because AWUPF is 0's based, the minimum any compliant drive promises on
  power fail is one logical block. That's the spec's version of "a sector
  is atomic".
- Revision 1.2 (2025-08-01) has the same section and was opened too.
- nvme-cli isn't installed on my machine, so my drive's AWUN/AWUPF are
  unknown (experiment 0003).
