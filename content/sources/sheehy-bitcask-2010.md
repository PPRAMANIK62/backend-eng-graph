---
id: sheehy-bitcask-2010
title: "Bitcask: A Log-Structured Hash Table for Fast Key/Value Data"
author: Justin Sheehy, David Smith (Basho Technologies)
url: https://riak.com/assets/bitcask-intro.pdf
kind: paper
primary: true
---

## Summary

The six-page design note for Bitcask, the default storage engine of the
Riak key-value database (Basho, 2010). A directory of append-only data
files, one active file for writes, an in-memory hash table ("keydir")
from each key to the file, offset and size of its latest value, a merge
process that rewrites only live values, and hint files that make
startup fast.

## Key claims

- The idea came from asking whether merging hash-table logs could match LSM trees. "he had a key insight about hash table log merging: that doing so could potentially be made as fast or faster than LSM-trees." (p. 1)
- One writer process per Bitcask directory. "A Bitcask instance is a directory, and we enforce that only one operating system process will open that Bitcask for writing at a given time." (p. 2)
- One active file; when it reaches a size threshold it's closed and never written again. "Once a file is closed, either purposefully or due to server exit, it is considered immutable and will never be opened for writing again." (p. 2)
- Writes only append. "The active file is only written by appending, which means that sequential writes do not require disk seeking." (p. 2)
- Each entry is crc, timestamp, key size, value size, key, value; the CRC covers the rest of the entry. (p. 2, entry figure)
- A delete is a tombstone write. "Note that deletion is simply a write of a special tombstone value, which will be removed on the next merge." (p. 2)
- The keydir. "A keydir is simply a hash table that maps every key in a Bitcask to a fixed-size structure giving the file, offset, and size of the most recently written entry for that key." (p. 3)
- The keydir entry holds file_id, value_sz, value_pos and tstamp. (p. 3, keydir figure)
- A read is one lookup and at most one seek. "Reading a value is simple, and doesn’t ever require more than a single disk seek." (p. 3)
- It leans on the OS cache for reads. "In many cases, the operating system’s filesystem read-ahead cache makes this a much faster operation than would be otherwise expected." (p. 3)
- Old values pile up until a merge. "This simple model may use up a lot of space over time, since we just write out new values without touching the old ones." (p. 4)
- Merge reads only the immutable (non-active) files and writes out live values. "The merge process iterates over all non-active (i.e. immutable) files in a Bitcask" (p. 4)
- Hint files hold positions instead of values. "These are essentially like the data files but instead of the values they contain the position and size of the values within the corresponding data file." (p. 4)
- Startup rebuilds the keydir by scanning. "If not, it scans all of the data files in a directory in order to build a new keydir." (p. 4)
- The data files are the log. "As the data files and the commit log are the same thing in Bitcask, recovery is trivial" (p. 5)
- The keydir must fit in memory. "the keydir structure grows by a small amount with the number of keys and must fit entirely in RAM." (p. 5)
- No compression. "Bitcask does not perform any compression of data" (p. 4)
- The API has a sync-on-put option and an explicit sync call. "sync on put (if this writer would prefer to sync the write file after every write operation)." (p. 6)
- Hint files sit next to data files, and startup scans them instead where they exist. "For any data file that has a hint file, that will be scanned instead for a much quicker startup time." (p. 4)

## Visuals worth redrawing

- p. 2: the entry layout (crc | tstamp | ksz | value_sz | key | value).
- p. 3: a get: keydir lookup, then one read at file_id + value_pos.

## My notes

- The paper has only early numbers ("5000-6000 writes per second" on a
  laptop with slow disks, p. 5). Too thin to use.
- It never says Bitcask can't do range scans; that follows from the
  keydir being a hash table.
