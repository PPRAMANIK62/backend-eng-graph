---
id: elastic-near-real-time-search
title: Near real-time search (Elasticsearch docs)
author: Elastic
url: https://www.elastic.co/docs/manage-data/data-store/near-real-time-search
kind: docs
primary: true
---

## Summary

Why a document written to Elasticsearch isn't searchable right away:
Lucene searches per segment, and new documents become visible only when
a refresh writes the in-memory buffer to a new segment and opens it.
Refresh runs every second by default, on indices that were searched
recently.

## Key claims

- Searchable within about a second. "When a document is stored in Elasticsearch, it is indexed and fully searchable in near real-time--within 1 second." (intro)
- Segments are like inverted indexes. "A segment is similar to an inverted index, but the word index in Lucene means "a collection of segments plus a commit point"." (page body)
- New segments can be searched before a full commit. "Lucene allows new segments to be written and opened, making the documents they contain visible to search without performing a full commit." (page body)
- That step is a refresh. "In Elasticsearch, this process of writing and opening a new segment is called a refresh." (page body)
- Default refresh interval and the idle exception. "By default, Elasticsearch periodically refreshes indices every second, but only on indices that have received one search request or more in the last 30 seconds." (page body)
- A refresh is cheap compared to a commit. "This is a much lighter process than a commit to disk, and can be done frequently without degrading performance." (page body)
- You can force one per request. "Setting the ?refresh option" (page body, ways to control refreshes)

## Visuals worth redrawing

- Buffer, uncommitted segment, committed segments (figures 1 and 2).
  Not redrawn.

## My notes

- Current docs; no version in the URL.
