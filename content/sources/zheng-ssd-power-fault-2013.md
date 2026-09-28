---
id: zheng-ssd-power-fault-2013
title: Understanding the Robustness of SSDs under Power Fault
author: Mai Zheng, Joseph Tucek, Feng Qin, Mark Lillibridge
url: https://www.usenix.org/system/files/conference/fast13/fast13-final80.pdf
published: 2013-02
accessed: 2026-09-28
kind: paper
primary: true
---

## Summary

FAST 2013 paper. The authors built hardware to cut power to SSDs while
they were being written, then checked what survived. 15 SSDs from 5
vendors, over 3,000 power faults. 13 of 15 lost or damaged data in ways
they shouldn't have. Old drives on Linux 2.6.32, but the failure types
are the useful part.

## Key claims

- 15 SSDs, 5 vendors, more than 3,000 fault injection cycles. "we subjected 15 SSDs from 5 different vendors to more than three thousand fault injection cycles in total." (§1)
- 13 of 15, including "enterprise-class" ones, failed. "we find that 13 out of the 15 devices, including the supposedly “enterprise-class” devices, exhibit failure behavior contrary to our expectations." (§1)
- One drive lost a third of its blocks after 8 faults; another stopped registering after 136. "another suffering one third of its blocks becoming inaccessible after merely 8 fault cycles." (§1)
- Failure types seen: bit corruption, shorn writes, unserializable writes, metadata corruption, dead device. "including bit corruption, shorn writes, unserializable writes, metadata corruption, and total device failure." (Abstract)
- A shorn write is one only partly done, below the sector size. "Operations are partially done at a level below the expected sector size" (Table 1)
- Unserializable: the final state doesn't match any order of the writes. "Final state of storage does not result from a serializable operation order" (Table 1)
- FTL remapping tables are kept in a volatile write-back cache protected by a supercapacitor. "the remapping tables are typically stored in a volatile write-back cache protected by a large supercapacitor." (§2.2)
- Makers keep that cache and supercapacitor small to save cost. "manufacturers typically attempt to minimize the size of the write-back cache as well as the supercapacitor backing it." (§2.2)
- FTL internals are secret. "FTL are generally considered confidential to the manufacturer" (§2.2)
- Four of the 15 had power-loss protection by the authors' check and the makers' statements. "four SSDs are equipped with power-loss protection." (§4.1)
- Shorn writes were seen on three devices; unserializable writes on eight. "three devices (SSDs no. 5, 14, and 15) showed shorn writes" (§5.1)
- Test host: Debian 6.0, kernel 2.6.32. "The operating system is Debian Linux 6.0 with Kernel 2.6.32." (§4.2)
- Conclusion: don't update a sole copy of important data in place. "the frequency of both bit corruption and shorn writes make update-in-place to a sole copy of data that needs to survive power failure inadvisable." (§7)

## Visuals worth redrawing

- Table 1: the six failure types, one line each.
- Figure 7: two shorn writes (a 4 KB record half old, half new).

## My notes

- 2013 drives (SATA/SAS, MLC and SLC). Vendors are blinded.
- I didn't check from the tables whether the four PLP drives failed.
