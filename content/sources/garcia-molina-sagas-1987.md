---
id: garcia-molina-sagas-1987
title: Sagas
author: Hector Garcia-Molina and Kenneth Salem
url: https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf
kind: paper
primary: true
---

## Summary

The SIGMOD 1987 paper that named sagas. A long-lived transaction is
split into a sequence of ordinary transactions, each with a
compensating transaction that undoes it semantically. The system
promises that either all steps run, or some prefix runs followed by
the compensations in reverse. It covers backward and forward recovery,
save-points, what to do when a compensation fails, and how to design
the database so long transactions can be split.

## Key claims

- A long-lived transaction can take hours or days. "takes a substantial amount of time, possibly on the order of hours or days" (1)
- The definition. "A LLT is a saga if it can be written as a sequence of transactions that can be interleaved with other transactions" (Abstract)
- The guarantee: complete, or compensate. "The database management system guarantees that either all the transactions in a saga are successfully completed or compensating transactions are run to amend a partial execution" (Abstract)
- Compensation is semantic, not a restore of old values. "The compensating transaction undoes, from a semantic point of view, any of the actions performed by Ti, but does not necessarily return the database to the state that existed when the execution of Ti began" (1)
- The airline example: cancel the reservation, don't restore the seat count, because others may have booked since. "If Ti reserves a seat on a flight, then Ci can cancel the reservation" (1)
- Others can see a saga half done, and nobody is told when it's compensated. "other transactions might see the effects of a partial saga execution" (1)
- Two ways to recover. "compensate for the executed transactions, backward recovery, or execute the missing transactions, forward recovery" (4)
- Pure forward recovery assumes every step eventually succeeds if retried. "In this case we must also assume that every sub-transaction in the saga will eventually succeed if it is retried enough times" (5, footnote)
- A compensation that keeps failing leaves the system stuck. "In this case, the system is stuck it cannot abort the transaction nor can it complete it" (6, Other errors)
- One way out of a stuck compensation: recovery blocks. "A recovery block is an alternate or secondary block of code that is provided in case a failure is detected in the primary block" (6, Other errors)
- After a crash, a saga with no end-saga entry in the log is aborted and compensated. "If there is a missing end-saga entry, then the saga is aborted" (4)
- Even real-world actions can be compensated with another action. "to compensate for the letter, send a second letter explaining the problem" (9)
- Some actions can't be undone at all. "if a transaction fires a missile, it may not be possible to undo this action" (9)
- Put in-flight state in the database so every step leaves it consistent, e.g. a relation for funds in transit. "we add a relation for funds in transit" (9)

## Visuals worth redrawing

- The two valid execution sequences in section 1: T1, T2 ... Tn, or
  T1 ... Tj, Cj ... C1.

## My notes

- The Cornell copy is a scan of the SIGMOD proceedings (pages 249 to
  259). Its text layer is OCR with many wrong letters and the scan
  drops most periods, so every quote above was checked against the
  page images, not the extracted text. Subscripts (Ti, Ci) are written
  inline.
- The paper says the name "saga" was suggested by Bruce Lindsay
  (Acknowledgments).
- The paper only treats sagas in a centralized database, but says they
  can clearly be implemented in a distributed one. (1)
