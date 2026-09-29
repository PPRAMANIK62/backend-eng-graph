---
id: postgres-textsearch-tables
title: "PostgreSQL documentation, 12.2 Tables and Indexes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/textsearch-tables.html
kind: docs
primary: true
---

## Summary

How to search table columns, and the two ways to index them: a GIN
expression index or a stored generated tsvector column (read at
version 18.6).

## Key claims

- Search works without an index but is too slow for most applications. "most applications will find this approach too slow, except perhaps for occasional ad-hoc searches." (12.2.1)
- Normalisation finds related forms: friend, friends, friendly. "This will also find related words such as friends and friendly, since all these are reduced to the same normalized lexeme." (12.2.1)
- A GIN expression index must use the two-argument to_tsvector with a named configuration. "Only text search functions that specify a configuration name can be used in expression indexes" (12.2.2)
- The query must use the same expression to hit the index. "WHERE to_tsvector('english', body) @@ 'a & b' can use the index, but WHERE to_tsvector(body) @@ 'a & b' cannot." (12.2.2)
- Alternative: a stored generated tsvector column kept up to date automatically. "To keep this column automatically up to date with its source data, use a stored generated column." (12.2.2)
- The separate column is faster (no to_tsvector recheck) but uses more disk; the expression index is simpler and smaller. "The expression-index approach is simpler to set up, however, and it requires less disk space since the tsvector representation is not stored explicitly." (12.2.2)

## Visuals worth redrawing

None.

## My notes

- Use coalesce so one NULL field doesn't null the whole document.
