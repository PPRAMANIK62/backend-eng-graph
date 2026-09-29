---
id: postgres-textsearch-controls
title: "PostgreSQL documentation, 12.3 Controlling Text Search"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/textsearch-controls.html
kind: docs
primary: true
---

## Summary

Parsing documents and queries, ranking, and highlighting (read at
version 18.6). The ranking section is the useful part: two built-in
functions, weights, length normalisation, and two honest warnings about
cost and the lack of global statistics.

## Key claims

- setweight labels lexemes A-D, typically title vs body. "This is typically used to mark entries coming from different parts of a document, such as title versus body." (12.3.1)
- websearch_to_tsquery accepts web-search-style syntax. "websearch_to_tsquery is a simplified version of to_tsquery with an alternative syntax, similar to the one used by web search engines." (12.3.2)
- Two ranking functions: ts_rank (frequency) and ts_rank_cd (cover density, adds proximity). "Ranks vectors based on the frequency of their matching lexemes." (12.3.3)
- Relevance is application-specific; the built-in functions are examples. "The built-in ranking functions are only examples." (12.3.3)
- Default weights {0.1, 0.2, 0.4, 1.0} for D, C, B, A. (12.3.3)
- Length normalisation is optional (default 0 ignores length). "0 (the default) ignores the document length" (12.3.3)
- Ranking uses no global information. "It is important to note that the ranking functions do not use any global information" (12.3.3)
- Ranking is expensive: it reads every matching document's tsvector. "Ranking can be expensive since it requires consulting the tsvector of each matching document, which can be I/O bound and therefore slow." (12.3.3)
- And it can't be avoided. "Unfortunately, it is almost impossible to avoid since practical queries often result in large numbers of matches." (12.3.3)

## Visuals worth redrawing

None.

## My notes

- "No global information" means no corpus-wide term statistics (how
  rare a word is across all documents). The page doesn't name BM25 or
  IDF; don't claim it does.
