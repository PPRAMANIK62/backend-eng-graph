---
id: wd-pc-sn740-brief
title: "Product Brief: Western Digital PC SN740 NVMe SSD"
author: Western Digital
url: https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/western-digital/product/internal-drives/pc-sn740-nvme-ssd/product-brief-pc-sn740-nvme-ssd.pdf
published: 2024
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

Two-page vendor product brief for the OEM NVMe drive in my laptop. Gives
interface, NAND type, speed, power, endurance and warranty per capacity.
Says nothing about latency, power-loss protection, DRAM, write cache or
atomic write sizes. Hosted on documents.sandisk.com; © 2024 Western
Digital.

## Key claims

- PCIe Gen 4.0 x4, NVMe v1.4b. "PCIe® Gen 4.0 x4, NVMeTM v1.4b" (Specifications, Interface)
- Western Digital TLC 3D NAND. "Western Digital® TLC 3D NAND" (Specifications, NAND Type)
- WD's own controller, NAND and firmware. "designed with Western Digital’s own in-house controller, 3D NAND and firmware" (page 1)
- 512GB model: sequential read up to 5,000 MB/s, sequential write up to 4,000 MB/s, random read 460K IOPS, random write 800K IOPS. (Specifications, Performance, 512GB column)
- Performance measured with CrystalDiskMark 8.0.5 over a 1000MB LBA range on an Intel i9-11900K desktop. "Performance is based on the CrystalDiskMark 8.0.5 benchmark using a 1000MB LBA range" (footnote 1)
- Endurance: 200 / 300 / 400 / 500 TBW for 256GB / 512GB / 1TB / 2TB, using the JEDEC client workload (JESD219). "TBW (terabytes written) values calculated using JEDEC client workload (JESD219)" (footnote 3)
- MTTF up to 1.75M hours; warranty 5 years or max TBW, whichever first. "5-years or Max Endurance (TBW) limit, whichever occurs first." (footnote 4)

## Visuals worth redrawing

None.

## My notes

- Not stated anywhere in the brief: read/write latency, queue depth for
  the IOPS numbers, power-loss protection, DRAM vs host memory buffer,
  volatile write cache, SLC cache size, sector sizes, AWUN/AWUPF. The
  write cache and sector size come from experiment 0003 instead.
- My drive is SDDQNQD-512G-1014 (experiment 0001), which matches the
  brief's M.2 2280 SED 512GB ordering code SDDQNQD-512G.
