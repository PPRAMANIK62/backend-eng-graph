---
id: riak-bitcask-backend
title: Bitcask (Riak KV 2.2.3 docs, setup and planning, backends)
author: Basho Technologies, Riak KV documentation
url: https://docs.riak.com/riak/kv/2.2.3/setup/planning/backend/bitcask/index.html
kind: docs
primary: true
---

## Summary

Riak KV 2.2.3's page on its default backend, Bitcask. Lists its
strengths and its one big weakness (all keys in memory), and documents
the settings that matter in operation: sync strategy, merge policy and
windows, and the fragmentation and dead-bytes merge triggers.

## Key claims

- Bitcask is Riak's default backend. "Bitcask is the default storage engine for Riak." (Installing Bitcask)
- At most one seek per read. "Bitcask never uses more than one disk seek to read a value and sometimes even that isn’t necessary due to filesystem caching done by the operating system." (Strengths)
- Crash recovery only has to check the tail. "The only items that may be lost are partially written records at the tail of the last file that was opened for writes." (Strengths)
- It checks the last record or two against their CRC. "Recovery operations need to review only the last record or two written and verify CRC data to ensure that the data is consistent." (Strengths)
- The weakness: every key in RAM. "Bitcask keeps all keys in memory at all times, which means that your system must have enough memory to contain your entire keyspace" (Weaknesses)
- The default sync strategy leaves writes in OS buffers. "If the system fails before those buffers are flushed, e.g. due to power loss, that data is lost." (Sync Strategy)
- The o_sync option syncs every write. "o_sync — uses the O_SYNC flag, which forces syncs on every write" (Sync Strategy)
- Merging trades disk space for simplicity. "This data management strategy trades disk space for operational efficiency." (Disk Usage and Merging Settings)
- Merge triggers: a file's ratio of dead keys (default 60%) or its dead bytes (default 512 MB). "The default is 512 MB." (Merge Triggers)
- A delete is two steps, a tombstone now and removal at merge. "Deleting a value from Bitcask is a two-step process: first, a tombstone is recorded in the open file for writes" (Bitcask Implementation Details)
- The delete also removes the key from the keydir; the merge then drops the old values. "references to that key are removed from the in-memory “keydir” information" (Bitcask Implementation Details)
- Merges can hurt; you can confine them to a window of hours. "If merging has a significant impact on performance of your cluster, or if your cluster has quiet periods in which little storage activity occurs, you may want to change this setting from the default." (Merge Policy)
- o_sync costs write throughput. "write throughput will suffer because each write will have to wait for the write to complete." (Sync Strategy)
- The dead-keys trigger is a percentage, 60% by default. "a merge will be triggered by the default setting (60%)." (Merge Triggers)

## Visuals worth redrawing

None.

## My notes

- The docs site's "latest" path serves the 2.2.3 page (its canonical
  link points there).
