---
id: redis-eval-intro
title: Scripting with Lua (Redis docs)
author: Redis
url: https://redis.io/docs/latest/develop/programmability/eval-intro/
kind: docs
primary: true
---

## Summary

The Redis docs page on Eval scripts: EVAL and EVALSHA, KEYS and ARGV,
redis.call vs redis.pcall, the volatile script cache, how scripts are
replicated (effects, not source, since 7.0), and behavior near
maxmemory.

## Key claims

- Atomic execution. "Redis guarantees the script's atomic execution." (intro)
- Scripts can make conditional updates across keys and types. "Such scripts can perform conditional updates across multiple keys, possibly combining several different data types atomically." (intro)
- Eval scripts belong to the application, so they aren't named or persisted. "Although the server executes them, Eval scripts are regarded as a part of the client-side application, which is why they're not named, versioned, or persisted." (intro)
- Every key a script touches must be passed as a key argument. "all names of keys that a script accesses must be explicitly provided as input key arguments." (Script parameterization)
- Don't compute key names inside the script. "Scripts should never access keys with programmatically-generated names or based on the contents of data structures stored in the database." (Script parameterization)
- Don't generate script source per call; parameterize with ARGV instead. "It is possible, although highly ill-advised, to have the application dynamically generate script source code per its needs." (Script parameterization)
- Scripts are cached by SHA1 and run with EVALSHA. "The cache's contents are organized by the scripts' SHA1 digest sums, so the SHA1 digest sum of a script uniquely identifies it in the cache." (Script cache)
- The cache is volatile: restart, failover or SCRIPT FLUSH clears it, and EVALSHA then fails with NOSCRIPT. "The cache may be cleared when the server restarts, during fail-over when a replica assumes the master role, or explicitly by SCRIPT FLUSH." (Cache volatility)
- Effects replication: the script's writes are wrapped in MULTI/EXEC for replicas and the AOF. "the sequence of commands that the script generated are wrapped into a MULTI/EXEC transaction and are sent to the replicas and AOF." (Replicating commands instead of scripts)
- Verbatim script replication is gone since 7.0; effects replication has been the default since 5.0. "As of Redis 7.0, verbatim replication is no longer supported." (Script replication)
- Near maxmemory, the first write that needs more memory aborts the script. "When memory usage in Redis exceeds the maxmemory limit, the first write command encountered in the script that uses additional memory will cause the script to abort (unless redis.pcall was used)." (Execution under low memory conditions)
- Scripts with a shebang line can't touch keys in different cluster slots by default. "scripts without #! can run commands that access keys belonging to different cluster hash slots, but ones with #! inherit the default flags, so they cannot." (Eval flags)
- On NOSCRIPT, load the script and call EVALSHA again; most clients do this for you. "Most of Redis' clients already provide utility APIs for doing that automatically." (Cache volatility)

## Visuals worth redrawing

None.

## My notes

- redis.call raises errors straight to the client; redis.pcall returns
  them to the script to handle (Interacting with Redis from a script).
