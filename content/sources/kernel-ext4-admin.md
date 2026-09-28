---
id: kernel-ext4-admin
title: ext4 General Information
author: Linux kernel documentation (ext4 developers)
url: https://docs.kernel.org/admin-guide/ext4.html
kind: docs
primary: true
---

## Summary

The kernel's admin guide for ext4: features, mount options and the three
data modes. The authoritative source for what `data=ordered`,
`data=writeback` and `data=journal` mean, which is the default, and the
5-second commit interval.

## Key claims

- ext4 grew out of ext3. "Ext4 is an advanced level of the ext3 filesystem" (Quick usage instructions / intro)
- data=journal puts all data through the journal first, and turns off delayed allocation and O_DIRECT. "All data are committed into the journal prior to being written into the main file system." (Options, data=journal)
- data=ordered is the default: data goes to its final place before the metadata commits. "All data are forced directly out to the main file system prior to its metadata being committed to the journal." (Options, data=ordered (*))
- data=writeback doesn't order data against metadata. "Data ordering is not preserved, data may be written into the main file system after its metadata has been committed to the journal." (Options, data=writeback)
- In ordered mode ext4 only journals metadata but groups related data with it in one transaction. "ext4 only officially journals metadata, but it logically groups metadata information related to data changes with the data blocks into a single unit called a transaction." (Data Mode, ordered mode)
- Writeback mode is about the level of XFS's default metadata journaling. "This mode provides a similar level of journaling as that of XFS and JFS in its default mode - metadata journaling." (Data Mode, writeback mode)
- Writeback can show wrong data in recently written files after a crash. "A crash+recovery can cause incorrect data to appear in files which were written shortly before the crash." (Data Mode, writeback mode)
- Writeback can expose stale data, a possible security issue. "running mounted with data=writeback can potentially leave stale data exposed in recently written files in case of an unclean shutdown" (Features / benchmarking note)
- Relative speed: ordered is slightly slower than writeback, much faster than journal. "this mode performs slightly slower than writeback but significantly faster than journal mode." (Data Mode, ordered mode)
- Journal mode is slowest except for mixed read/write at once. "This mode is the slowest except when data needs to be read from and written to disk at the same time" (Data Mode, journal mode)
- commit= defaults to 5 seconds; a power loss can lose up to that much metadata, without damaging the file system. "The default value is 5 seconds." (Options, commit=nrsec)
- Delayed allocation means even older data can be lost. "Note that due to delayed allocation even older data can be lost on power failure" (Options, commit=nrsec)
- delalloc (default) defers choosing blocks until writeout. "Defer block allocation until just before ext4 writes out the block(s) in question." (Options, delalloc (*))
- Barriers are on by default and make volatile write caches safe. "Write barriers enforce proper on-disk ordering of journal commits, making volatile disk write caches safe to use, at some performance penalty." (Options, barrier=)

## Visuals worth redrawing

None.

## My notes

- (*) marks defaults on the page.
- The page doesn't give a date or kernel version.
