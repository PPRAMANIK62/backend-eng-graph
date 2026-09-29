---
id: luo-lsm-survey-2019
title: "LSM-based Storage Techniques: A Survey"
author: Chen Luo, Michael J. Carey
url: https://arxiv.org/abs/1812.07527
kind: paper
primary: false
---

## Summary

A survey of LSM-tree research and systems (arXiv version 3, 2019). Its
section 2 is the best short explanation of the modern LSM tree: history
from differential files and the original paper, out-of-place updates,
memory and disk components, leveling vs tiering merge policies, bloom
filters, partitioning into SSTables, recovery, and a cost model for
write, read and space costs. Section 3 surveys improvements (write
amplification, write stalls, etc.).

## Key claims

- In-place vs out-of-place. "An in-place update structure, such as a B+ tree, directly overwrites old records to store new updates." (2.1)
- Out-of-place writes go to new places. "an out-of-place update structure, such as an LSM-tree, always stores updates into new locations instead of overwriting old entries." (2.1)
- The cost of out-of-place: reads. "the major problem of this design is that read performance is sacrificed since a record may be stored in any of multiple locations." (2.1)
- Earlier out-of-place designs (differential files, 1976; Postgres's log-structured storage in the 1980s; LFS). "Differential files [63], presented in 1976, were an early example of an out-of-place update structure." (2.1)
- The LSM tree was proposed in 1996 and built the merge into the structure. "The LSM-tree [52], proposed in 1996, addressed these problems by designing a merge process which is integrated into the structure itself" (2.1)
- The original rolling merge isn't used today. "the originally proposed rolling merge process is not used by today’s LSM-based storage systems due to its implementation complexity." (2.1)
- Equal size ratios between levels minimize write cost (from the original paper). "write performance is optimized when the size ratios Ti = |Ci+1 |/|Ci | between all adjacent components are the same." (2.1)
- Tiering came from the stepped-merge policy of Jagadish et al. "This policy become the tiering merge policy [24, 25] used in today’s LSM-tree implementations." (2.1)
- Today: writes go into a memory component; a delete writes an anti-matter entry (tombstone). "An insert or update operation simply adds a new entry, while a delete operation adds an anti-matter entry indicating that a key has been deleted." (2.2.1)
- Disk components are immutable and merged into new ones. "today’s LSM-tree implementations commonly exploit the immutability of disk components1 to simplify concurrency control and recovery." (2.2.1)
- Typical memory components: skip list or B+-tree; disk components: B+-trees or SSTables. "Today’s LSM-tree implementations typically organize their memory components using a concurrent data structure such as a skip-list or a B+ -tree" (2.2.1)
- What an SSTable is. "An SSTable contains a list of data blocks and an index block; a data block stores key-value pairs ordered by keys, and the index block stores the key ranges of all data blocks." (2.2.1)
- Point lookups go newest to oldest and stop at the first match. "A point lookup query, which fetches the value for a specific key, can simply search all components one by one, from newest to oldest, and stop immediately after the first match is found." (2.2.1)
- Range queries merge all components with a priority queue. "A range query can search all components at the same time, feeding the search results into a priority queue to perform reconciliation." (2.2.1)
- Leveling: one component per level, each level T times larger. "In the leveling merge policy (Figure 3a), each level only maintains one component, but the component at level L is T times larger than the component at level L − 1." (2.2.1)
- Tiering: up to T components per level, merged together into the next level. "In contrast, the tiering merge policy (Figure 3b) maintains up to T components per level." (2.2.1)
- What each is for. "In general, the leveling merge policy optimizes for query performance since there are fewer components to search in the LSM-tree." (2.2.1)
- Bloom filter basics: k hash functions set bits; all bits 1 means "probably". "By design, the Bloom filter can report false positives but not false negatives." (2.2.2)
- False positives cost I/O, not correctness. "Note that the false positives reported by a Bloom filter do not impact the correctness of a query, but a query may waste some I/O searching for non-existent keys." (2.2.2)
- The false positive formula is (1 − e^(−kn/m))^k, with the best k = (m/n) ln 2. "The false positive rate of a Bloom filter can be computed as" (2.2.2; the formula itself is typeset and doesn't survive text extraction)
- 10 bits per key is the common default, for about 1%. "In practice, most systems typically use 10 bits/key as a default configuration, which gives a 1% false positive rate." (2.2.2)
- Partitioning components into SSTables bounds each merge's time and temporary space. "partitioning breaks a large component merge operation into multiple smaller ones, bounding the processing time of each merge operation as well as the temporary disk space needed to create new components." (2.2.2)
- Partitioning makes sequential inserts nearly free to merge. "For sequentially created keys, essentially no merge is performed since there are no components with overlapping key ranges." (2.2.2)
- Partitioned leveling was pioneered by LevelDB; only it is fully implemented industrially. "In the partitioned leveling merge policy, pioneered by LevelDB [4], the disk component at each level is" (2.2.2)
- Level 0 isn't partitioned, which helps absorb bursts. "This design can also help the system to absorb write bursts since it can tolerate multiple unpartitioned components at level 0." (2.2.2)
- WAL for durability, no-steal, redo only on recovery. "During recovery for an LSM-tree, the transaction log is replayed to redo all successful transactions, but no undo is needed due to the no-steal policy." (2.2.3)
- LevelDB and RocksDB keep a metadata log of SSTable changes. "a typical approach, used in LevelDB [4] and RocksDB [6], is to maintain a separate metadata log to store all changes to the structural metadata, such as adding or deleting SSTables." (2.2.3)
- Cost model (worst case, unpartitioned): write cost O(T·L/B) for leveling vs O(L/B) for tiering; zero-result lookups O(L·e^(−M/N)) vs O(T·L·e^(−M/N)); space amplification O((T+1)/T) vs O(T). (2.3, Table 1)
- Leveling merges each component T − 1 times before pushing it on. "For leveling, a component at each level will be merged T − 1 times until it fills" (2.3)
- The trade in one sentence. "However, components must be merged more frequently, which will incur a higher write cost by a factor of T" (2.3)
- Write stalls come from background flushes and merges. "it often exhibits write stalls and unpredictable write latencies since heavy operations such as flushes and merges run in the background." (3.3.3)
- No-steal means a memory component is flushed only after the writes in it have finished. "That is, a memory component can only be flushed when all active write transactions have terminated." (2.2.3)
- Short range queries cost O(L) for leveling and O(T·L) for tiering. "For a short range query, the I/O cost will be O(L) for leveling and O(T · L) for tiering." (2.3)
- With Bloom filters, a lookup of an existing key costs about one I/O either way. "the successful point lookup I/O cost for both leveling and tiering will be O(1)." (2.3)
- The first L − 1 levels hold about 1/T of the data (worst case for leveled space amplification). "the worst case occurs when all of the data at the first L − 1 levels, which contain approximately" (2.3; "1/T of the total data" is typeset and garbled in text extraction)

## Visuals worth redrawing

- Figure 3: leveling vs tiering, before and after a merge.
- Figure 4: partitioned leveling, one SSTable at level 1 merged with the
  overlapping SSTables at level 2.

## My notes

- Only the arXiv version (v3) was opened, so cite that.
- The cost model is worst case and for an unpartitioned tree; real
  engines (partitioned leveling) often do better.
