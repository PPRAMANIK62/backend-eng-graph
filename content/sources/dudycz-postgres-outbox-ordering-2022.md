---
id: dudycz-postgres-outbox-ordering-2022
title: How Postgres sequences issues can impact your messaging guarantees
author: Oskar Dudycz
url: https://event-driven.io/en/ordering_in_postgres_outbox/
kind: blog
primary: false
---

## Summary

Why a polling outbox relay that reads "rows with position greater than
the last one I saw" can skip messages in Postgres: sequence values are
taken before commit, so a higher number can commit first. Walks through
fixes: a gapless counter (serialises all writers), gap detection with a
delay (Marten's high water mark), and filtering by transaction id with
`pg_snapshot_xmin(pg_current_snapshot())`.

## Key claims

- Sequence values are assigned before the transaction commits, so commit order can differ from number order. "They’re evaluated before the transaction commit." (sequences section)
- A rolled-back transaction's number is never reused, leaving gaps. "The number is lost if the transaction fails and is rolled back." (sequences section)
- Two problems follow: out of order, and gaps. "we may have messages out of order," (sequences section)
- A relay that treats a gap as a rollback and moves its position past it loses the rows that commit later. "If we optimistically assume that the gaps were caused by rollbacks, we may lose messages." (race condition example)
- A gapless counter table fixes it but locks and serialises every writer. "it’s locking the whole seq table making all the processing that’s calling this function sequential." (nuke option)
- Gap detection: wait, assume gaps are rollbacks, record them (Marten calls it the high water mark). (gap detection)
- Store the writing transaction's id (xid8) with each row and only read rows from transactions older than the oldest still-running one, from `pg_snapshot_xmin(pg_current_snapshot())`. "we’ll effectively get the minimum active transaction id." (last idea)
- The order you then get follows when transactions started, not when rows were appended. "our ordering guarantee respects when the transaction was started, not when the message was appended." (last idea)
- Long transactions delay the relay. "Our queries may be a bit delayed if our transactions last long" (last idea)

## Visuals worth redrawing

- Three transactions taking positions 11, 12, 13, with 13 committing first; a relay reading at that moment moves its position to 13 and skips 11 and 12.

## My notes

- Dudycz maintains Marten and Emmett (event stores on Postgres), so he
  builds such relays, but he isn't a Postgres developer. primary: false.
