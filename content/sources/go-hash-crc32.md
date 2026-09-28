---
id: go-hash-crc32
title: "crc32 package: hash/crc32"
author: The Go Authors
url: https://pkg.go.dev/hash/crc32
kind: docs
primary: true
---

## Summary

Go's standard library CRC-32 package. It predefines three polynomials
(IEEE, Castagnoli, Koopman) and computes checksums from a table. The page
shows go1.27.1. I also read the package's source on the master branch
(`crc32.go`, `crc32_amd64.go`, `crc32_arm64.go` at
https://github.com/golang/go/tree/master/src/hash/crc32) to check hardware
support, which the docs page doesn't mention.

## Key claims

- The package computes CRC-32. "Package crc32 implements the 32-bit cyclic redundancy check, or CRC-32, checksum." (package overview)
- IEEE is the most common polynomial, used by ethernet, gzip, zip and png. "IEEE is by far and away the most common CRC-32 polynomial." (Constants, comment)
- Castagnoli (CRC-32C) is used in iSCSI and detects errors better than IEEE. "Has better error detection characteristics than IEEE." (Constants, comment on Castagnoli)
- Koopman also detects errors better than IEEE. (Constants)
- API: `MakeTable(poly)`, `Checksum(data, tab)`, `Update(crc, tab, p)`, `ChecksumIEEE`, `NewIEEE`, `New(tab)`. (Index)
- On amd64, Castagnoli uses the SSE 4.2 CRC32 instruction when the CPU has it. "uses the SSE 4.2 CRC32 instruction." (crc32_amd64.go, comment on castagnoliSSE42)
- On arm64, Castagnoli uses the CPU's CRC32 instructions when `cpu.ARM64.HasCRC32` is true. (crc32_arm64.go, archAvailableCastagnoli)
- Without hardware support it falls back to a software slicing-by-8 table. "Initialize the slicing-by-8 table." (crc32.go, castagnoliInitOnce)

## Visuals worth redrawing

None.

## My notes

- The hardware path is picked at run time, so the same Go binary is fast on a CPU with SSE 4.2 and slower on one without.
