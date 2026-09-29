---
id: leveldb-skiplist
title: leveldb db/skiplist.h
author: LevelDB authors (Google)
url: https://github.com/google/leveldb/blob/main/db/skiplist.h
kind: code
primary: true
---

## Summary

LevelDB's skip list, the structure under its memtable. A template over
key and comparator that allocates nodes from an arena, never deletes
them, and lets readers run without locks while one writer (guarded by an
outside mutex) inserts.

## Key claims

- One writer at a time, readers without locks. "Writes require external synchronization, most likely a mutex." (top comment, Thread safety)
- Readers need no locking. "Apart from that, reads progress without any internal locking or synchronization." (top comment)
- Nodes are never removed while the list lives. "Allocated nodes are never deleted until the SkipList is destroyed." (Invariants)
- A node is filled in before it's published with release stores. "Only Insert() modifies the list, and it is careful to initialize a node and use release-stores to publish the nodes in one or more lists." (Invariants)
- No duplicate keys may be inserted. "REQUIRES: nothing that compares equal to key is currently in the list." (Insert)
- Maximum height is 12. "enum { kMaxHeight = 12 };" (class SkipList)
- LevelDB's memtable is this skip list. "typedef SkipList<const char*, KeyComparator> Table;" (db/memtable.h in the same repository, opened alongside)
- Each extra level has probability 1 in 4. "static const unsigned int kBranching = 4;" (RandomHeight)
- The public interface is only Insert and Contains (plus an iterator); there is no delete. "void Insert(const Key& key);" and "bool Contains(const Key& key) const;" (class SkipList)

## Visuals worth redrawing

None.

## My notes

- kBranching = 4 matches Pugh's suggested p = 1/4.
- No delete: the memtable is thrown away whole after it's flushed, so
  the skip list never needs one.
