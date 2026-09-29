---
id: search-architecture
title: Search at scale
depth: short
phase: 17
note: >-
  Inverted indexes split across machines, and keeping them fed.
needs: [full-text-search, partitioning, change-data-capture]
leads_to: []
compare_with: [cqrs, dual-writes]
---

# Search at scale

When search outgrows one database's [[full-text-search|full-text
index]], it usually moves to a separate search cluster, such as
Elasticsearch, built on the Lucene library. That raises two design
problems. The index has to be split across machines and queried as one,
and it has to be kept in step with the database that really owns the
data.

## Split by document, ask every shard

A search index is split into shards, and each document belongs to
exactly one of them. Elasticsearch usually picks the shard from the
document ID, the same [[partitioning]] you'd use for any key-value
data. Each shard indexes only its own documents, and has a primary
copy and replicas: a write goes to the shard's primary, which
passes it to every replica in its in-sync set and acknowledges only
when they all have it (see [[in-sync-replicas]]).

That layout makes writes cheap and searches expensive. A query for
"red shoes" can match documents in any shard, so it has to go to all of
them. The node that receives the query becomes the coordinator: it
sends the query to one copy of every shard, gathers each shard's best
matches, merges them and answers. This is the local-index layout from
[[partitioned-secondary-indexes]]: cheap to keep up to date, costly to
query.

![Write path: the database, as source of truth, feeds a change stream in commit order to an indexer, which routes each document by ID to one shard's primary and then its replicas. The search index is split into three shards, each with a primary and a replica. Read path: a query for "red shoes" goes to a coordinating node, which sends it to one copy of every shard and merges the top hits; the slowest shard sets the pace.](img/search-architecture-layout.svg)

*Writes touch one shard; every search touches them all.*

Two things follow:

- **The slowest shard sets the pace.** A search isn't done until every
  shard answers, so one slow node slows every query routed to it. Fan-out
  like this is where [[tail-latency]] comes from.
- **Partial answers look like success.** If a shard fails and no other
  copy can answer, Elasticsearch still returns 200 OK with the results
  it has, and reports the failed shards in the `_shards` part of the
  response. Check it if missing results matter.

Replicas help reads as well as safety: any in-sync copy of a shard can
answer, and Elasticsearch chooses among them with what it calls
adaptive replica selection.

## New documents show up after a refresh

Writes aren't searchable the instant they're acknowledged. Lucene
searches a set of index segments. New documents sit in a memory buffer
until a refresh writes them into a new segment and opens it for search,
which is much cheaper than a full commit to disk. Elasticsearch
refreshes every second by default, but only on indices that got at
least one search in the last 30 seconds. So "save, then immediately
search for it" can miss the document you just saved, unless you ask
for a refresh on that write.

## Keeping the index fed

The database stays the source of truth; the search index is a copy
derived from it. The tempting way to keep them in step is dual writes:
your application writes to the database and then to the search index.
Two concurrent updates can reach the two stores in different orders,
and a crash between the two writes leaves one of them stale. No error
is raised, so the drift goes unnoticed until someone finds a search
result that's wrong (see [[dual-writes]]).

The fix is to have one ordered log of changes and let the indexer
consume it. The simplest source of that log is the database itself:
[[change-data-capture]] reads its changes in commit order and streams
them to the indexer, which applies them in the same order and keeps
track of how far it has got. The index is then eventually consistent
with the database: it lags, but it doesn't drift.

## Where it gets tricky

**Search reads are behind by design.** Between the change stream's lag
and the refresh interval, a user who edits something and then searches
for it may not see it. Read the item itself from the database, and use
search only to find which items to show.

**Two copies can briefly disagree.** A primary indexes a document
before its replicas have it, so a search that hits the primary can see
a change the replica doesn't, and one the client hasn't had
acknowledged yet.

## What this means when you build

- Treat the search index as derived data you can rebuild from the
  database, never as the only copy.
- Feed it from the database's change log, not from dual writes in your
  application.
- Expect every query to fan out to every shard, and watch the slowest
  shard, not the average.
- Check for partial results in responses.
- Tell users (and your tests) that search results can trail writes by
  a second or more.

## Further reading

- [Reading and writing documents](https://www.elastic.co/docs/deploy-manage/distributed-architecture/reading-and-writing-documents), Elastic, Elasticsearch docs. Routing by document ID, primary-backup replication, the coordinating node's fan-out and partial results.
- [Near real-time search](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search), Elastic, Elasticsearch docs. Segments and refresh: why a new document takes up to a second to show up.
- [Using logs to build a solid data infrastructure (or: why dual writes are a bad idea)](https://www.confluent.io/blog/using-logs-to-build-a-solid-data-infrastructure-or-why-dual-writes-are-a-bad-idea/), Martin Kleppmann, 2015. Why writing to a database and a search index side by side drifts, and how one ordered log fixes it.
