---
id: couchdb-replication-conflicts
title: "Replication and conflict model (Apache CouchDB docs)"
author: Apache CouchDB project
url: https://docs.couchdb.org/en/stable/replication/conflicts.html
kind: docs
primary: true
---

## Summary

The CouchDB 3.5 docs on what happens when two copies of a database both
take edits to the same document and then replicate to each other. Both
versions are kept as conflicting revisions in a revision tree, one wins
deterministically for plain reads, and the application has to find the
conflicts and merge them.

## Key claims

- Replication is one-way over HTTP; a full sync is a push plus a pull. "Replication of databases takes place over HTTP, and can be either a “pull” or a “push”, but is unidirectional." (2.3.1)
- After two sides edit the same document and replicate, both versions are kept everywhere. "The answer is simple: both versions exist on both sides!" (2.3.1)
- Peers don't need setup. "peers do not have to be configured or tracked." (2.3.1)
- A read shows one winner, picked the same way on every peer. "By default, CouchDB picks one arbitrary revision as the “winner”, using a deterministic algorithm so that the same choice will be made on all peers." (2.3.1)
- The loser isn't gone, just hidden. "they have just been hidden away as a conflicting revision." (2.3.1)
- On a single node, conflicts are refused instead. "When working on a single node, CouchDB will avoid creating conflicting revisions by returning a 409 Conflict error." (2.3.2)
- Because every update names the revision it replaces. "when you PUT a new version of a document, you must give the _rev of the previous version." (2.3.2)
- Conflicting edits make a revision tree. "this history branches into a tree, where the current conflicting revisions for this document form the tips (leaf nodes) of this tree" (2.3.3)
- A plain GET hides conflicts. "The basic GET /{db}/{docid} operation will not show you any information about conflicts." (2.3.4)
- Resolving means merge, write, delete the others. "Or it could attempt to merge them, write back the merged version, and delete the conflicting versions - that is, to resolve the conflict permanently." (2.3.4)
- A background sweeper leaves a window where saved changes seem to vanish. "there will be a window between a conflict being introduced and it being resolved." (2.3.6)
- Some merges are easy. "Sometimes it will be easy: e.g. if a document contains a list which is only ever appended to, then you can perform a union of the two list versions." (2.3.7)
- Compaction throws away old bodies, so the common ancestor may be gone. "When you compact a database, the bodies of all the non-leaf documents are discarded." (2.3.3)
- Handle conflicts on read and the app works with many writers. "An application written this way never has to deal with a PUT 409, and is automatically multi-master capable." (2.3.6)
- To merge by diff, keep the diff in the new revision. "So if you want to work with diffs, the recommended way is to store those diffs within the new revision itself." (2.3.7)

## Visuals worth redrawing

- The desktop/laptop business card diagram: v1 pushed, v2a and v2b made
  apart, then both exist on both sides after push and pull (2.3.1).

## My notes

- The business card example (email changed on one machine, phone on the
  other) is the clearest small example of a multi-leader conflict.
