---
id: berenson-critique-ansi-isolation-1995
title: A Critique of ANSI SQL Isolation Levels
author: Hal Berenson, Phil Bernstein, Jim Gray, Jim Melton, Elizabeth O'Neil, Patrick O'Neil
url: https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf
kind: paper
primary: true
---

## Summary

The SIGMOD 1995 paper (Microsoft Research tech report MSR-TR-95-51) that
showed the SQL-92 isolation levels, defined by three "phenomena" (dirty
read, non-repeatable read, phantom), are ambiguous and incomplete. It
writes each phenomenon as a pattern in a history of reads and writes,
argues for the broad reading of each, adds dirty write (P0) and lost
update (P4), defines snapshot isolation, and names read skew (A5A) and
write skew (A5B). Its Table 4 is still the standard map of which level
allows which anomaly.

## Key claims

- SQL-92 defines its levels by three phenomena. "ANSI SQL-92 [MS, ANSI] defines Isolation Levels in terms of phenomena: Dirty Reads, Non-Repeatable Reads, and Phantoms." (Abstract)
- Those definitions miss real behaviour. "This paper shows that these phenomena and the ANSI SQL definitions fail to characterize several popular isolation levels, including the standard locking implementations of the levels." (Abstract)
- Dirty read, in words. "P1 (Dirty Read): Transaction T1 modifies a data item. Another transaction T2 then reads that data item before T1 performs a COMMIT or ROLLBACK." (2.2) and "If T1 then performs a ROLLBACK, T2 has read a data item that was never committed and so never really existed." (2.2)
- Non-repeatable read, in words. "P2 (Non-repeatable or Fuzzy Read): Transaction T1 reads a data item. Another transaction T2 then modifies or deletes that data item and commits." (2.2) and "If T1 then attempts to reread the data item, it receives a modified value or discovers that the data item has been deleted." (2.2)
- Phantom, in words. "P3 (Phantom): Transaction T1 reads a set of data items satisfying some <search condition>. Transaction T2 then creates data items that satisfy T1’s <search condition> and commits." (2.2) and "If T1 then repeats its read with the same <search condition>, it gets a set of data items different from the first read." (2.2)
- None of the three can happen in a serial history. "None of these phenomena could occur in a serial history." (2.2)
- History notation: w1[x] is a write of x by transaction 1, r2[x] a read by transaction 2, c1 and a1 commit and abort. "“w1[x]” means a write by transaction 1 on data item x (which is how a data item is “modified’), and “r2[x]” represents a read of x by transaction 2." (2.2)
- Strict (anomaly) versus broad (phenomenon) readings of dirty read. "P1: w1[x]...r2[x]...((c1 or a1) and (c2 or a2) in any order)" and "A1: w1[x]...r2[x]...(a1 and c2 in any order)" (2.2)
- The strict phantom reading only covers inserts; the paper's P3 covers any write to the predicate. "Note that the English statement of ANSI SQL P3 just prohibits inserts to a predicate, but P3 above intentionally prohibits any write (insert, update, delete) affecting a tuple satisfying the predicate once the predicate has been read." (2.2)
- People misread the table as defining serializable. "The prominence of the table compared to this extra proviso leads to a common misconception that disallowing the three phenomena implies serializability." (2.2)
- History H1: a transfer of 40 from x to y, while T2 reads x after the debit and y before the credit and sees a total of 60. Neither transaction aborts, so the strict A1 misses it; the broad P1 catches it. "H1: r1[x=50]w1[x=10]r2[x=10]r2[y=50]c2 r1[y=50]w1[y=90]c1" (3) and "H1 indeed violates P1." (3)
- The broad reading is the right one. "Remark 4. Strict interpretations A1, A2, and A3 have unintended weaknesses. The correct interpretations are the Broad ones." (3)
- History H2: T1 reads x=50 before a transfer and y=90 after it, and sees 140. No item is read twice. "H2 is non-serializable — it is another inconsistent analysis, where T1 sees a total balance of 140." (3)
- A predicate lock covers rows that don't exist yet, and can be an infinite set. "A Read (resp. Write) predicate lock on a given <search condition> is effectively a lock on all data items satisfying the <search condition>. This may be an infinite set." (2.3) and "It includes data present in the database and also any phantom data items not currently in the database but that would satisfy the predicate if they were inserted or if current data items were updated to satisfy the <search condition>." (2.3)
- In a locking scheduler, a conflicting lock request waits. "If a transaction holds a lock, and another transaction requests a conflicting lock, then the new lock request is not granted until the former transaction’s conflicting lock has been released." (2.3)
- Forbidding P2 is the same as holding read locks to the end; forbidding P3, read predicate locks. "Prohibiting P2 means long-term Read locks on data items." (3) and "Finally, Prohibiting P3 means long-term Read predicate locks." (3)
- Dirty write (P0) and why it matters: rollback by restoring before-images breaks. "Without protection from P0, the system can’t undo updates by restoring before images." (3)
- SQL-92 only rules out dirty writes at SERIALIZABLE. "Locking READ UNCOMMITTED provides long duration write locking to avoid a phenomenon called "Dirty Writes," but ANSI SQL does not exclude this anomalous behavior other than ANSI SERIALIZABLE." (3)
- Locking systems hold write locks to the end. "Even the weakest locking systems hold long duration write locks." (3)
- Recommendation that every level forbid dirty writes. "Remark 3: ANSI SQL isolation should be modified to require P0 for all isolation levels." (3)
- Lost update defined. "P4 (Lost Update): The lost update anomaly occurs when transaction T1 reads a data item and then T2 updates the data item (possibly based on a previous read), then T1 (based on its earlier read value) updates the data item and commits." (4.1)
- Lost update as a history. "P4: r1[x]...w2[x]...w1[x]...c1" (4.1)
- History H4: both read 100, T2 writes 120 and commits, T1 writes 130. "H4: r1[x=100] r2[x=100] w2[x=120] c2 w1[x=130] c1" (4.1) and "The final value of x contains only the increment of 30 added by T1." (4.1)
- READ COMMITTED allows it; forbidding P2 forbids it. "P4 is possible at the READ COMMITTED isolation level" (4.1) and "However, forbidding P2 also precludes P4, since w2[x] comes after r1[x] and before T1 commits or aborts." (4.1)
- Cursor stability exists to stop lost updates on rows read through a cursor. "Cursor Stability is designed to prevent the lost update phenomenon." (4.1)
- Snapshot isolation's first-committer-wins rule prevents lost updates. "This feature, called First-committer-wins prevents lost updates (phenomenon P4)." (4.2)
- Snapshot isolation is not serializable because reads and writes happen at different moments. "Snapshot Isolation is non-serializable because a transaction’s Reads come at one instant and the Writes at another." (4.2)
- History H5: both read x=50 and y=50, T1 writes y=-40, T2 writes x=-40, under a rule that x + y stays positive. "H5: r1[x=50] r1[y=50] r2[x=50] r2[y=50] w1[y=-40] w2[x=-40] c1 c2" (4.2) and "while T1 and T2 both act properly in isolation, the constraint fails to hold in H5." (4.2)
- Read skew. "A5A Read Skew Suppose transaction T1 reads x, and then a second transaction T2 updates x and y to new values and commits. If now T1 reads y, it may see an inconsistent state, and therefore produce an inconsistent state as output." (4.2)
- Write skew. "A5B Write Skew Suppose T1 reads x and y, which are consistent with C(), and then a T2 reads x and y, writes x, and commits. Then T1 writes y." (4.2); if there is a constraint between x and y, it can be violated (4.2 to 4.3)
- Non-repeatable read is a special case of read skew. "Fuzzy Reads (P2) is a degenerate form of Read Skew where x=y." (4.2)
- Bank example of write skew. "Write Skew (A5B) could arise from a constraint at a bank, where account balances are allowed to go negative as long as the sum of commonly held balances remains non-negative, with an anomaly arising as in history H5." (4.2)
- Snapshot isolation allows write skew; locking REPEATABLE READ allows phantoms but not write skew, so neither is stronger. "Snapshot Isolation histories prohibit histories with anomaly A3, but allow A5B, while REPEATABLE READ does the opposite." (4.2)
- Snapshot isolation still allows the broad phantom: two transactions each read the tasks for a predicate, see 7 hours, and each insert a 1-hour task under an 8-hour limit. "Consider a constraint that says a set of job tasks determined by a predicate cannot have a sum of hours greater than 8." (4.2) and "Since the two transactions are inserting different data items (and different index entries as well, if any), this scenario is not precluded by First-Committer-Wins and can occur in Snapshot Isolation." (4.2)
- Snapshot isolation has no phantoms in the strict sense. "Perhaps most remarkable of all, Snapshot Isolation has no phantoms (in the strict sense of the ANSI definitions A3)." (4.2)
- Oracle's Read Consistency allows general lost updates and read skew. "Read Consistency is stronger than READ COMMITTED (it disallows cursor lost updates (P4C)) but allows non-repeatable reads (P3), general lost updates (P4), and read skew (A5A)." (4.3)
- The name REPEATABLE READ misleads. "ANSI’s choice of the term Repeatable Read is doubly unfortunate: (1) repeatable reads do not give repeatable results, and (2) the industry had already used the term to mean exactly that: repeatable reads mean serializable in several products." (5)
- Lower isolation trades correctness for concurrency. "Lower isolation levels increase transaction concurrency but risk showing transactions a fuzzy or incorrect database." (1 Introduction)
- Two actions conflict when they come from different transactions, touch the same item, and at least one writes. "Two actions in a history are said to conflict if they are performed by distinct transactions on the same data item and at least one of is a Write action." (2.1)
- A "data item" can be a row, a page, a table or a message. "it could be a table row, a page, an entire table, or a message on a queue." (2.1)
- Serializable means having the same dependency graph as some serial history. "A history is serializable if it is equivalent to a serial history — that is, if it has the same dependency graph (inter-transaction temporal data flow) as some history that executes transactions one at a time in sequence." (2.1)
- The broad phenomena are locking rules in disguise. "Put another way, P0, P1, P2, and P3 are disguised redefinition’s of locking behavior." (3, Remark 6)
- Snapshot isolation has none of the three strict ANSI anomalies, so passing them doesn't mean serializable. "Remark 10. Snapshot Isolation histories preclude anomalies A1, A2 and A3." (4.2)
- A snapshot read never blocks. "A transaction running in Snapshot Isolation is never blocked attempting a read as long as the snapshot data from its Start-Timestamp can be maintained." (4.2)
- Snapshot isolation is a kind of MVCC. "Snapshot Isolation is a type of multiversion concurrency control." (4.2)
- It's stronger than READ COMMITTED. "Returning now to Snapshot Isolation, it is surprisingly strong, even stronger than READ COMMITTED." (4.2)
- Early products with first-committer-wins. "Borland’s InterBase 4 [THA] and the engine underlying Microsoft’s Exchange System both provide Snapshot Isolation with the First-committer-wins feature." (4.2)
- Old start timestamps allow time travel. "Snapshot Isolation gives the freedom to run transactions with very old timestamps, thereby allowing them to do time travel" (4.2)
- SI is at least READ COMMITTED: first-committer-wins stops dirty writes and the timestamps stop dirty reads. "In Snapshot Isolation, first-committer-wins precludes P0 (dirty writes), and the timestamp mechanism prevents P1 (dirty reads), so Snapshot Isolation is no weaker than READ COMMITTED." (4.2, Remark 8)
- And it rules out read skew, which READ COMMITTED allows. "In addition, A5A is possible under READ COMMITTED, but not under the Snapshot Isolation timestamp mechanism." (4.2, Remark 8)
- Long update transactions do badly under SI. "since the long-running transactions are unlikely to be the first writer of everything they write, and so will probably be aborted." (4.2)
- The ANSI phenomena are ambiguous, and the paper adds new ones and defines snapshot isolation. "The three ANSI phenomena are ambiguous." (3) and "An important multiversion isolation type, Snapshot Isolation, is defined." (Abstract, read across the two-column layout)
- Reads come from the snapshot at the start timestamp. "reads data from a snapshot of the (committed) data as of the time the transaction started, called its Start-Timestamp." (4.2)
- A transaction sees its own writes. "The transaction's writes (updates, inserts, and deletes) will also be reflected in this snapshot, to be read again if the transaction accesses (i.e., reads or updates) the data a second time." (4.2)
- The commit rule. "The transaction successfully commits only if no other transaction T2 with a Commit-Timestamp in T1’s execution interval [StartTimestamp, Commit-Timestamp] wrote data that T1 also wrote. Otherwise, T1 will abort." (4.2)

## Visuals worth redrawing

- Figure 2: the isolation levels as a hierarchy, edges labelled with the
  anomaly that separates them.
- Table 4: isolation levels against P0, P1, P4C, P4, P2, P3, A5A, A5B.

## My notes

- Read from the Microsoft Research PDF of the tech report (13 pages,
  two-column; read column by column).
- The paper's own "P3" row in 4.3 ("non-repeatable reads (P3)") looks
  like a typo for P2. Not used.
- The P8-1 writer read the same tech report from the arXiv copy
  (https://arxiv.org/pdf/cs/0701157); the Microsoft URL returned 403 to
  curl at that time. Quotes appended by that writer were checked
  against the arXiv text.
