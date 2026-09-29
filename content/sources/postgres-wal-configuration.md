---
id: postgres-wal-configuration
title: "WAL Configuration, PostgreSQL documentation section 28.5"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/wal-configuration.html
kind: docs
primary: true
---

## Summary

The WAL tuning chapter of the PostgreSQL 18 manual (read as 18.6).
What a checkpoint is and when it runs, why it causes an I/O load and how
Postgres spreads it out, the extra WAL right after a checkpoint, how WAL
segments are recycled, and how group commit works (commit_delay,
commit_siblings, XLogFlush).

## Key claims

- A checkpoint guarantees data files hold everything logged before it. "Checkpoints are points in the sequence of transactions at which it is guaranteed that the heap and index data files have been updated with all information written before that checkpoint." (28.5, second paragraph)
- At checkpoint time dirty pages are flushed and a checkpoint record is written. "At checkpoint time, all dirty data pages are flushed to disk and a special checkpoint record is written to the WAL file." (28.5, second paragraph)
- Recovery starts from the redo record named by the latest checkpoint. "the crash recovery procedure looks at the latest checkpoint record to determine the point in the WAL (known as the redo record) from which it should start the REDO operation." (28.5, second paragraph)
- WAL before the redo record can then be recycled or removed. "after a checkpoint, WAL segments preceding the one containing the redo record are no longer needed and can be recycled or removed." (28.5, second paragraph)
- Flushing all dirty pages is a big I/O load, so Postgres throttles it. "The checkpoint requirement of flushing all dirty data pages to disk can cause a significant I/O load." (28.5, third paragraph)
- A checkpoint starts every checkpoint_timeout or when max_wal_size is about to be exceeded; defaults 5 minutes and 1 GB. "The default settings are 5 minutes and 1 GB, respectively." (28.5, fourth paragraph)
- More frequent checkpoints mean faster recovery but more page flushing. "This allows faster after-crash recovery, since less work will need to be redone." (28.5, fifth paragraph)
- With full_page_writes, the first change to a page after each checkpoint logs the whole page, so shorter intervals mean more WAL. "the first modification of a data page after each checkpoint results in logging the entire page content." (28.5, fifth paragraph)
- Checkpoints cost twice: the dirty-page writes and the extra WAL after. "Checkpoints are fairly expensive, first because they require writing out all currently dirty buffers, and second because they result in extra subsequent WAL traffic as discussed above." (28.5, sixth paragraph)
- checkpoint_completion_target spreads the writes over the interval; default 0.9. "To avoid flooding the I/O system with a burst of page writes, writing dirty buffers during a checkpoint is spread over a period of time." (28.5, seventh paragraph)
- Spreading out checkpoints makes recovery keep more WAL. "prolonging checkpoints affects recovery time, because more WAL segments will need to be kept around for possible use in recovery." (28.5, seventh paragraph)
- Without checkpoint_flush_after, pages sit in the OS page cache and the fsync at the end stalls. "inducing a stall when fsync is issued at the end of a checkpoint." (28.5, eighth paragraph)
- checkpoint_flush_after often cuts latency but can hurt workloads bigger than shared_buffers and smaller than the page cache. "This setting will often help to reduce transaction latency, but it also can have an adverse effect on performance" (28.5, eighth paragraph)
- If WAL-driven checkpoints come closer together than checkpoint_warning, the server logs a hint to raise max_wal_size. (28.5, sixth paragraph)
- A checkpoint is skipped if no WAL was written since the last one; the CHECKPOINT command forces one. "If no WAL has been written since the previous checkpoint, new checkpoints will be skipped even if checkpoint_timeout has passed." (28.5, fourth paragraph)
- checkpoint_completion_target defaults to 0.9. "With the default value of 0.9, PostgreSQL can be expected to complete each checkpoint a bit before the next scheduled checkpoint" (28.5, seventh paragraph)
- XLogInsertRecord puts records in WAL buffers; XLogFlush writes and flushes them, mostly at commit. "Normally, WAL buffers should be written and flushed by an XLogFlush request, which is made, for the most part, at transaction commit time" (28.5, thirteenth paragraph)
- Group commit: a leader sleeps commit_delay while followers queue behind it, and the leader's one sync flushes them all. "The commit_delay parameter defines for how many microseconds a group commit leader process will sleep after acquiring a lock within XLogFlush, while group commit followers queue up behind the leader." (28.5, commit_delay paragraph)
- No sleep if fewer than commit_siblings other sessions are in active transactions. "No sleep will occur if fsync is not enabled, or if fewer than commit_siblings other sessions are currently in active transactions" (28.5, commit_delay paragraph)
- commit_delay trades latency for throughput. "the purpose of commit_delay is to allow the cost of each flush operation to be amortized across concurrently committing transactions (potentially at the expense of transaction latency)" (28.5, following paragraph)
- Suggested starting point: half the time pg_test_fsync reports for a flush after one 8 kB write. "A value of half of the average time the program reports it takes to flush after a single 8kB write operation is often the most effective setting for commit_delay" (28.5, same paragraph)
- Too high a commit_delay can lower throughput. "a setting of commit_delay that is too high can increase transaction latency by so much that total transaction throughput suffers." (28.5, same paragraph)
- Even with commit_delay at zero, commits that arrive while the previous flush is running form a group. "each group will consist only of sessions that reach the point where they need to flush their commit records during the window in which the previous flush operation (if any) is occurring." (28.5, next paragraph)
- At higher client counts group commit happens anyway. "At higher client counts a “gangway effect” tends to occur, so that the effects of group commit become significant even when commit_delay is zero" (28.5, same paragraph)
- commit_delay only helps with concurrent commits and when throughput is limited by commit rate. "Setting commit_delay can only help when (1) there are some concurrently committing transactions, and (2) throughput is limited to some degree by commit rate" (28.5, same paragraph)
- commit_delay defaults to zero. "When commit_delay is set to zero (the default), it is still possible for a form of group commit to occur" (28.5, commit_delay paragraphs)
- With WAL archiving on, old segments are archived before they are recycled or removed. "When WAL archiving is being done, the WAL segments must be archived before being recycled or removed." (28.5, second paragraph)

## Visuals worth redrawing

None; a timeline of checkpoint I/O spread over the interval would be our own.

## My notes

- The default commit_delay (0) and commit_siblings (5) are in
  postgres-runtime-config-wal.
