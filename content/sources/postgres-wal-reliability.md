---
id: postgres-wal-reliability
title: "Reliability, PostgreSQL documentation section 28.1"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/wal-reliability.html
kind: docs
primary: true
---

## Summary

PostgreSQL 18 (read as 18.6) on what it takes for committed data to
survive: the caching layers between memory and disk, drives that don't
honour flushes, torn page writes and the full page images that repair
them, and which structures are checksummed.

## Key claims

- Sectors are commonly 512 bytes, and power loss can stop a multi-sector write partway. "Disk platters are divided into sectors, commonly 512 bytes each." (28.1, torn-write paragraph)
- Postgres typically writes 8192 bytes (16 sectors) at a time, and power loss can leave some sectors written. "PostgreSQL typically writes 8192 bytes, or 16 sectors, at a time" (28.1, torn-write paragraph)
- It writes full page images to the WAL before changing the page on disk, so recovery can restore torn pages. "PostgreSQL periodically writes full page images to permanent WAL storage before modifying the actual page on disk." (28.1, torn-write paragraph)
- On a filesystem that prevents partial page writes, like ZFS, full_page_writes can be turned off. "If you have file-system software that prevents partial page writes (e.g., ZFS), you can turn off this page imaging by turning off the full_page_writes parameter." (28.1, torn-write paragraph)
- A battery-backed controller doesn't prevent torn pages unless it writes whole 8 kB pages. "Battery-Backed Unit (BBU) disk controllers do not prevent partial page writes unless they guarantee that data is written to the BBU as full (8kB) pages." (28.1, torn-write paragraph)
- Many SSDs don't honour cache flush commands by default. "If you use SSDs, be aware that many of these do not honor cache flush commands by default." (28.1)
- Every WAL record has a CRC-32C, checked during recovery and replication. "Each individual record in a WAL file is protected by a CRC-32C (32-bit) check that allows us to tell if record contents are correct." (28.1, checksum list)
- Full page images in WAL are always checksum protected. "full page images recorded in WAL records are always checksum protected." (28.1, checksum list)

## Visuals worth redrawing

None.

## My notes

- "Data pages are checksummed by default" is new wording for 18
  (checksums became the initdb default); not relied on.
