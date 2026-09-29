---
id: full-text-search
title: Full-text search
depth: short
phase: 6
note: >-
  tsvector, GIN indexes and ranking in Postgres. Where it runs out.
needs: [index-types]
leads_to: [search-architecture]
compare_with: []
---

# Full-text search in Postgres

Full-text search finds documents that contain the words someone typed,
including other forms of those words, and sorts the results by how well
they match. Postgres has it built in: a `tsvector` type for documents,
a `tsquery` type for searches, GIN indexes to make it fast and ranking
functions to order the results. For a search box over your own data,
that's often enough, and it saves running a second system.

## Why LIKE isn't enough

`WHERE body LIKE '%satisfy%'` has three problems. It doesn't know
language, so it misses "satisfies". It can't rank, so a thousand
matches come back in no useful order. And there's no [[indexes|index]] support for it, so every
search reads every row.

## From text to lexemes

Full-text search first boils each document down to the words that
matter:

1. **Split it into tokens.** A parser breaks the text into words,
   numbers, email addresses and so on.
2. **Normalise each token into a lexeme.** Lower-case it, strip
   suffixes so "cats" and "cat" become the same, and drop stop words
   ("a", "the", "and") that are too common to help.
3. **Store the lexemes with their positions** in a `tsvector`. The
   positions let a search match phrases and rank documents where the
   words sit close together higher.

![Two parts. Top: the sentence "The cats ate the rats" goes through three steps: split into five tokens, normalise into lexemes (lower case, plural s removed, the stop word "the" dropped), and store as a tsvector: cat at position 2, ate at 3, rat at 5. Bottom: a GIN index maps each lexeme to the list of rows that contain it, for example cat to rows 1, 7 and 42 and rat to rows 1, 42 and 90; a search for cat and rat intersects the two lists to get rows 1 and 42.](img/full-text-search-lexemes.svg)

*From text to lexemes, and the inverted index that finds them. The row numbers are made up.*

Searches get the same treatment. `to_tsquery('english', 'fat & rats')`
normalises the words too, so it looks for the lexemes `fat` and `rat`.
The match operator is `@@`:

```sql
SELECT to_tsvector('english', 'fat cats ate fat rats')
       @@ to_tsquery('english', 'fat & rat');   -- true
```

Without normalisation, `rats` would never match `rat`. A tsquery can
combine words with `&` (and), `|` (or), `!` (not) and `<->` (followed
by, for phrases). For text typed by users, `websearch_to_tsquery`
accepts the kind of syntax people use in web search boxes.

Which parser, stop words and stemming rules to use is set by a text
search configuration, one per language (`english`, `german`, ...).

## Making it fast with a GIN index

A search without an index still has to compute a tsvector for every
row. That's fine for an occasional query and too slow for a search box.

The usual index is GIN (see [[index-types]]). It's an *inverted index*:
one entry per lexeme, each with a compressed list of the rows that
contain it. A search for `fat & rat` finds the list for each word and
keeps the rows in both. Two ways to set it up:

- **An expression index**:
  `CREATE INDEX ON docs USING GIN (to_tsvector('english', body));`
  It must name the configuration (`'english'`), and your query has to
  use exactly the same expression, or the index isn't used.
- **A stored generated column** that holds the tsvector, with a GIN
  index on it. It costs disk space, but queries are simpler and faster,
  because Postgres doesn't have to recompute the tsvector to check a
  match.

GiST can index tsvectors too, but it's lossy: it stores a fixed-size
signature per document, so it returns false matches that Postgres then
checks against the real row. GIN is the preferred choice.

## Ranking

`ts_rank` scores a document by how often the search words appear in
it. `ts_rank_cd` also rewards words that appear close together.

Words in a title usually matter more than words in the body. You can
label lexemes with a weight, A to D, using `setweight` when you build
the tsvector (title as A, body as D), and the ranking functions count
them differently: by default A counts 1.0 and D counts 0.1. Both
functions can also divide by document length, so a short document with
five matches can beat a long one with five.

## Where it runs out

**Ranking reads every match.** The index finds the matching rows, but
to rank them Postgres has to read each matching row's tsvector. If a
search matches a large share of the table, that's a lot of reading
before it can return the top 10, and there's no way around it.

**Ranking has no view of the whole collection.** The ranking functions
look at one document at a time. They know nothing about the rest of the
collection, such as how common a word is across all your documents. The Postgres docs call the built-in functions examples and
expect you to adjust relevance for your application.

**Weighted queries skip part of the index.** GIN stores the lexemes
but not their weights, so a query that asks for weights has to recheck
the table rows.

**Size limits.** A tsvector must be under 1 MB, a lexeme under 2 KB,
and one lexeme keeps at most 256 positions. Very large documents need
splitting.

When relevance tuning or scale become the product, that's the job of a
dedicated search system, which [[search-architecture]] covers.

## What this means when you build

- Store a generated tsvector column with a GIN index, and set weights
  for titles and other important fields.
- Always pass the configuration name (`'english'`) so queries match the
  index.
- Use `websearch_to_tsquery` for text typed by users.
- Watch searches that match a large part of the table: ranking them is
  the slow part. A tighter filter before ranking helps.
- Reach for a separate search engine only when ranking quality or
  scale outgrows this, not by default.

## Further reading

- [12.1. Introduction](https://www.postgresql.org/docs/current/textsearch-intro.html), PostgreSQL docs, version 18. Why LIKE falls short, and how documents become tsvectors of lexemes.
- [12.2. Tables and Indexes](https://www.postgresql.org/docs/current/textsearch-tables.html), PostgreSQL docs, version 18. Expression indexes vs a generated tsvector column.
- [12.3. Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html), PostgreSQL docs, version 18. Ranking, weights, normalisation, and why ranking is expensive.
- [12.9. Preferred Index Types for Text Search](https://www.postgresql.org/docs/current/textsearch-indexes.html), PostgreSQL docs, version 18. GIN as an inverted index, and GiST's lossy signatures.
- [12.11. Limitations](https://www.postgresql.org/docs/current/textsearch-limitations.html), PostgreSQL docs, version 18. The hard size limits.
