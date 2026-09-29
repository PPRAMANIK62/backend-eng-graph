---
id: kung-optimistic-concurrency-1981
title: On Optimistic Methods for Concurrency Control
author: H. T. Kung, John T. Robinson
url: https://www.eecs.harvard.edu/~htk/publication/1981-tods-kung-robinson.pdf
kind: paper
primary: true
---

## Summary

The ACM Transactions on Database Systems paper (1981) that named
optimistic concurrency control. Transactions read freely, write to
private copies, then validate at the end; if validation fails they are
backed up and restarted. It lists what's wrong with locking and says
when optimism should win: when conflicts are rare.

## Key claims

- The idea: rely on restarting transactions, not on locks. "The methods used are “optimistic” in the sense that they rely mainly on transaction backup as a control mechanism, “hoping” that conflicts between transactions will not occur." (Abstract)
- Locking costs something even for read-only transactions. "Even read-only transactions (queries), which cannot possibly affect the integrity of the data, must, in general, use locking in order to guarantee that the data being read are not modified by other transactions at the same time." (Section 1, disadvantage 1)
- Locks held to the end of the transaction lower concurrency. "To allow a transaction to abort itself when mistakes occur, locks cannot be released until the end of the transaction." (Section 1, disadvantage 4)
- Locking may only be needed in the worst case. "Most important for the purposes of this paper, locking may be necessary only in the worst case." (Section 1, disadvantage 5)
- Three phases. "It is required that any transaction consist of two or three phases: a read phase, a validation phase, and a possible write phase (see Figure 1)." (Section 1)
- Writes go to local copies during the read phase. "During the read phase, all writes take place on local copies of the nodes to be modified." (Section 1)
- Serial validation compares the read set with the write sets of transactions that committed meanwhile. "if (write set of transaction with transaction number t intersects read set) then valid := false;" (Section 4, the tend procedure)
- If validation fails, restart. "If validation does fail, the transaction will be backed up and start over again as a new transaction." (Section 1)
- No locks means no deadlock, but starvation. "Since locks are not used, it is deadlockfree (however, starvation is a possible problem, a solution for which we discuss)." (Section 1)
- Their fix for a starving transaction is to run it while holding the validation critical section, which is like locking the whole database. "This is equivalent to write-locking the entire database, and the “starving” transaction will run to completion." (Section 3, end)
- Locking and optimism are mirror images. "(1) In a locking approach, transactions are controlled by having them wait at certain points, while in an optimistic approach, transactions are controlled by backing them up." (Section 7)
- Each has one main difficulty, fixed by the other. "The major difficulty in locking approaches is deadlock, which can be solved by using backup; in an optimistic approach, the major difficulty is starvation, which can be solved by using locking." (Section 7)
- Where optimism should win. "These methods may well be superior to locking methods for systems where transaction conflict is highly unlikely." (Section 7)
- Examples given: read-mostly systems and big tree indexes. "Examples include querydominant systems and very large tree-structured indexes." (Section 7)

## Visuals worth redrawing

- Figure 1: the three phases (read, validation, write) along a time line.

## My notes

- Validation checks serial equivalence using transaction numbers
  assigned at the end of the read phase (Sections 3 to 5). Not needed in
  detail for a short node.
