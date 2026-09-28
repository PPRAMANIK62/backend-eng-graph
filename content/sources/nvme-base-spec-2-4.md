---
id: nvme-base-spec-2-4
title: NVM Express Base Specification, Revision 2.4
author: NVM Express, Inc.
url: https://nvmexpress.org/wp-content/uploads/NVM-Express-Base-Specification-Revision-2.4-Ratified-2026.07.31.pdf
published: 2026-07-31
accessed: 2026-09-28
kind: spec
primary: true
---

## Summary

The core NVMe specification, released August 2026. Used here only for the
volatile write cache: how a drive says it has one, how the host turns it
on or off, and what the Flush command promises.

## Key claims

- The Identify Controller data has a Volatile Write Cache (VWC) field. "Volatile Write Cache (VWC): This field indicates attributes related to the presence of a volatile write cache in the controller." (Identify Controller data structure, VWC)
- Bit VWCP says whether a volatile write cache is present. "If this bit is set to ‘1’, then a volatile write cache is present in the controller." (VWC, VWCP)
- If present, the host enables or disables it with the Volatile Write Cache feature, and uses Flush to make it non-volatile. "the host controls whether the volatile write cache is enabled with a Set Features command specifying the Volatile Write Cache feature identifier" (VWC, VWCP)
- Flush makes the contents of the volatile write cache non-volatile. "The Flush command is used to request that the contents of volatile write cache be made non-volatile." (Flush command, section 7.2)
- Flush covers everything completed before it was submitted. "The flush applies to all commands for the specified namespace(s) completed by the controller prior to the submission of the Flush command." (Flush command)

## Visuals worth redrawing

None.

## My notes

- Very long (35,000+ lines of extracted text). Only these parts read.
- The WD SN740 implements NVMe 1.4b, an older revision; the VWC/Flush
  model is the same idea, but I didn't open 1.4b to confirm wording.
