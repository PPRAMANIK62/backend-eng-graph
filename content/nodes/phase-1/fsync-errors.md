---
id: fsync-errors
title: What happens when fsync fails?
depth: short
phase: 1
note: >-
  What happens when fsync fails: the kernel may drop the data and mark
  it clean, so retrying lies. Postgres's 2018 fsyncgate.
needs: [fsync]
leads_to: []
compare_with: []
updated: 2026-09-28
---

# What happens when fsync fails?

When [[fsync]] returns an error, the obvious move is to try again. On
Linux that's wrong: after a failed write-back, the kernel usually marks
the affected pages clean, so a second fsync has nothing left to write
and reports success while your data never reached the disk. PostgreSQL
learned this in 2018, in what came to be called "fsyncgate", and changed
how it handles the error.

## How a retry ends up lying

Follow one page through a database checkpoint:

1. The database writes a page with `write`. It lands in the
   [[page-cache]] as a dirty page.
2. Later, the kernel tries to write that page to the drive, and the
   drive returns an I/O error.
3. The kernel records the error and marks the page **clean**. It isn't
   dirty anymore, even though the disk never got the new data.
4. The database calls fsync. It returns `EIO`. The database treats the
   checkpoint as failed and plans to try again.
5. On the retry, fsync finds no dirty pages and no new error. It returns
   success.
6. The database finishes the checkpoint and throws away the log it would
   have needed to redo the write. The data is lost, and nothing reported
   it.

Two more things make it worse. On ext4 and XFS the page in RAM still
holds the new data, so reads keep returning the right answer until the
page is evicted.
After that, reads come from disk and return the old version. And a
clean page can be evicted at any moment under memory pressure, so when
the damage becomes visible is up to chance.

![Seven steps of one page over time, with what the page in RAM and the disk hold at each step. The disk holds old data throughout; RAM holds new data until the page is evicted. The first fsync returns EIO, the second returns 0, and a read after eviction returns the old data.](img/fsync-errors-page-timeline.svg)

*One page through a failed write-back. The retry reports success while the disk still has the old data.*

## How the kernel's reporting changed

The details depend on the kernel version, as recorded by the Postgres
developers:

- **Before Linux 4.13**, write-back errors could be lost in several ways,
  and pages were marked clean after an error.
- **Linux 4.13** added new infrastructure for tracking write-back
  errors (`errseq_t`). In 4.13 and 4.15, though, fsync only reported
  errors that happened after you opened the file. Postgres closed and
  reopened files and passed fsync work to a separate checkpointer
  process, so the error could land on nobody.
- **Linux 4.14 and 4.16 onward** make sure someone sees the file's first
  error even across close and open. But each error is still reported
  only once, and the pages are still dropped or marked clean.

So on current Linux the rule is: you'll probably hear about a write-back
error once, and after that the data it was about may be gone.

Other systems differ. FreeBSD keeps the failed buffers dirty, so a later
fsync tries again. NetBSD and macOS throw them away, so a later fsync
can succeed despite the loss.

## What Postgres did, and what a 2020 study found

Postgres stopped retrying. Since a commit for PostgreSQL 12, backported
to 9.4 through 11, a failed fsync makes the server PANIC: it crashes,
restarts, rebuilds its state from the write-ahead log, and redoes the
whole checkpoint instead of retrying the fsync. MySQL's InnoDB and MongoDB's WiredTiger
made similar changes.

A USENIX ATC 2020 study tested this more widely on Linux 5.2.11. It
injected disk write failures under ext4, XFS and Btrfs:

- All three marked pages clean after fsync failed, so retrying didn't
  help on any of them.
- What the clean page held differed. ext4 and XFS kept the new data in
  memory; Btrfs went back to the previous on-disk state.
- ext4 with full data journaling sometimes reported the failure on the
  next call instead of the one that failed.

It then tested Redis, LMDB, LevelDB, SQLite and PostgreSQL. None handled
fsync failure fully. Redis didn't even check fsync's return value.
Several applications looked correct while the data stayed cached, then
returned stale data once it was evicted or the machine restarted. Even
PostgreSQL, with its crash-and-replay fix, could lose data in some
update cases.

## Where it gets tricky

The rules are still per OS, per kernel version and per filesystem. The
Postgres wiki's table stops at Linux 4.16 and was last edited in 2023,
and the 2020 study used Linux 5.2.11. Check them against your kernel
before relying on the details. ZFS is a likely exception even on Linux,
because it doesn't use the regular page cache.

## What this means when you build

- Treat a failed fsync as "the data may be gone". Don't retry and carry
  on.
- The simplest safe response is to crash and recover from a log that's
  already on disk, as Postgres does.
- Recover only from what's on disk. The page cache can show you data the
  disk doesn't have.
- Always check fsync's return value.

## Further reading

- [Fsync Errors](https://wiki.postgresql.org/wiki/Fsync_Errors), PostgreSQL wiki, 2023. The Postgres developers' own account: what went wrong, the fix, and how each OS and Linux version behaves.
- [Can Applications Recover from fsync Failures?](https://www.usenix.org/conference/atc20/presentation/rebello), Rebello et al., USENIX ATC 2020. Fault injection under ext4, XFS and Btrfs, and how five real applications fail.
