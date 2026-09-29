---
id: postgres-textsearch-intro
title: "PostgreSQL documentation, 12.1 Full Text Search: Introduction"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/textsearch-intro.html
kind: docs
primary: true
---

## Summary

Why LIKE and regexes aren't enough for text search, and how Postgres
turns a document into a tsvector of normalised lexemes and a search
into a tsquery (read at version 18.6).

## Key claims

- LIKE and regex have no linguistic support. "There is no linguistic support, even for English." (12.1)
- They can't rank. "They provide no ordering (ranking) of search results, which makes them ineffective when thousands of matching documents are found." (12.1)
- They can't use an index. "They tend to be slow because there is no index support, so they must process all documents for every search." (12.1)
- Preprocessing: parse into tokens, normalise tokens into lexemes (lower-case, strip suffixes, drop stop words), store sorted lexemes with positions. "Converting tokens into lexemes." (12.1)
- Stop words are too common to be useful. "stop words, which are words that are so common that they are useless for searching." (12.1)
- Positions let dense matches rank higher. "a document that contains a more “dense” region of query words is assigned a higher rank than one with scattered query words." (12.1)
- tsvector stores documents, tsquery queries, @@ matches. "A data type tsvector is provided for storing preprocessed documents, along with a type tsquery for representing processed queries" (12.1)
- Searching and ranking happen on the tsvector; original text only for display. "Searching and ranking are performed entirely on the tsvector representation of a document" (12.1.1)
- Without normalisation `rats` doesn't match `rat`. "The elements of a tsvector are lexemes, which are assumed already normalized, so rats does not match rat." (12.1.2)
- tsquery supports & | ! and <-> (FOLLOWED BY) for phrases. "Searching for phrases is possible with the help of the <-> (FOLLOWED BY) tsquery operator" (12.1.2)
- Configurations pick a parser and dictionaries per language. "Text search configurations select a parser and a set of dictionaries to use to normalize the tokens produced by the parser." (12.1.3)
- The parser splits text into classes of tokens such as numbers, words and email addresses. "It is useful to identify various classes of tokens, e.g., numbers, words, complex words, email addresses" (12.1)
- to_tsquery normalises the words of a query, and to_tsvector('fat cats ate fat rats') @@ to_tsquery('fat & rat') is true. "helpful in converting user-written text into a proper tsquery, primarily by normalizing words appearing in the text." (12.1.2)

## Visuals worth redrawing

- Text → tokens → lexemes → tsvector pipeline (12.1).

## My notes

None.
