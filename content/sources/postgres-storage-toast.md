---
id: postgres-storage-toast
title: TOAST (PostgreSQL docs, 66.2)
author: PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/storage-toast.html
kind: docs
primary: true
---

## Summary

How Postgres stores values too large for its fixed-size pages
(PostgreSQL 18 docs). Rows can't span pages, so big variable-length
values are compressed and/or moved out of line into a separate TOAST
table, in chunks, with a pointer left in the row.

## Key claims

- Rows can't span pages. "PostgreSQL uses a fixed page size (commonly 8 kB), and does not allow tuples to span multiple pages." (66.2)
- So big values are compressed or split. "To overcome this limitation, large field values are compressed and/or broken up into multiple physical rows." (66.2)
- Only variable-length types can be TOASTed. "To support TOAST, a data type must have a variable-length (varlena) representation" (66.2)
- The largest value is 1 GB. "thereby limiting the logical size of any value of a TOAST-able data type to 1 GB (2³⁰ - 1 bytes)." (66.2)
- Each table with such columns gets a TOAST table. "If any of the columns of a table are TOAST-able, the table will have an associated TOAST table" (66.2.1)
- Values are cut into chunks of about 2000 bytes. "by default this value is chosen so that four chunk rows will fit on a page, making it about 2000 bytes" (66.2.1)
- The trigger is a row wider than about 2 kB. "The TOAST management code is triggered only when a row value to be stored in a table is wider than TOAST_TUPLE_THRESHOLD bytes (normally 2 kB)." (66.2.1)
- Default strategy: compress first, then move out of line. "Compression will be attempted first, then out-of-line storage if the row is still too big." (66.2.1, EXTENDED)
- EXTERNAL skips compression so substring reads can fetch only part of the value. "Use of EXTERNAL will make substring operations on wide text and bytea columns faster (at the penalty of increased storage space)" (66.2.1)
- Why this beats letting rows span pages: the main table stays small. "Thus, the main table is much smaller and more of its rows fit in the shared buffer cache than would be the case without any out-of-line storage." (66.2.1)
- Big values are only fetched when needed. "The big values of TOASTed attributes will only be pulled out (if selected at all) at the time the result set is sent to the client." (66.2.1)
- Sorts shrink too. "Sort sets shrink also, and sorts will more often be done entirely in memory." (66.2.1)

## Visuals worth redrawing

None.

## My notes

- The docs describe "a little test" with HTML pages: stored in about
  half the raw size, main table about 10% of the data. No versions or
  setup given, so not used as a number.
