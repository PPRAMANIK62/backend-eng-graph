---
id: postgres-textsearch-limitations
title: "PostgreSQL documentation, 12.11 Limitations"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/textsearch-limitations.html
kind: docs
primary: true
---

## Summary

The hard size limits of Postgres text search (read at version 18.6).

## Key claims

- Each lexeme under 2 KB. "The length of each lexeme must be less than 2 kilobytes" (12.11)
- A tsvector under 1 MB. "The length of a tsvector (lexemes + positions) must be less than 1 megabyte" (12.11)
- At most 256 positions per lexeme. "No more than 256 positions per lexeme" (12.11)
- Positions from 1 to 16,383. "Position values in tsvector must be greater than 0 and no more than 16,383" (12.11)

## Visuals worth redrawing

None.

## My notes

- The page's "less than 264" lexemes is 2^64 with the superscript lost
  in text extraction.
