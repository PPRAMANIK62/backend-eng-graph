---
id: redis-object-encoding
title: OBJECT ENCODING
author: Redis
url: https://redis.io/docs/latest/commands/object-encoding/
kind: docs
primary: true
---

## Summary

The command reference for OBJECT ENCODING, which returns how Redis
stores the value at a key internally. The page lists every encoding for
each data type, with the version that introduced or dropped it. Living
doc, undated.

## Key claims

- The command shows the internal encoding. "Returns the internal encoding for the Redis object stored at key." (description)
- Available since 2.2.3, O(1). (header: "Available since: Redis Open Source 2.2.3", "Time complexity: O(1)")
- Strings: raw, int (64-bit signed integers), embstr (string in the same allocation as the object, up to 44 bytes). "embstr can be strings with lengths up to the hardcoded limit of OBJ_ENCODING_EMBSTR_SIZE_LIMIT or 44 bytes." (Details)
- int encoding saves space for integer strings. "int, strings representing integers in a 64-bit signed interval, encoded in this way to save space." (Details)
- Lists: listpack for small lists (7.0+), quicklist otherwise. "quicklist, encoded as linkedlist of ziplists or listpacks." (Details)
- Sets: hashtable, intset for small integer-only sets, listpack for small sets (7.2+). "intset, a special encoding used for small sets composed solely of integers." (Details)
- Hashes: hashtable, or listpack for small hashes (7.0+; ziplist up to 6.2). "listpack, Redis >= 7.0, a space-efficient encoding used for small hashes." (Details)
- Sorted sets: skiplist, or listpack when small. "skiplist, normal sorted set encoding." (Details)
- Streams: a radix tree of listpacks. "stream, encoded as a radix tree of listpacks." (Details)
- Conversion to the general encoding is automatic. "All the specially encoded types are automatically converted to the general type once you perform an operation that makes it impossible for Redis to retain the space saving encoding." (Details)

## Visuals worth redrawing

None.

## My notes

- The page names "skiplist" for sorted sets; it doesn't say the skiplist
  is paired with a hash table. Don't claim that from here.
