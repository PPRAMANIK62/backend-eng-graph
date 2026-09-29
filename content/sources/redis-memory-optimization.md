---
id: redis-memory-optimization
title: Memory optimization
author: Redis
url: https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/
kind: docs
primary: true
---

## Summary

Redis's guide to using less memory. The part used here is the first
section: small hashes, lists, sets and sorted sets are stored in a
compact encoding until they pass a size limit, then converted to the
normal structure. Explains why that stays fast. Living doc, undated.

## Key claims

- Special compact encodings for small aggregates since Redis 2.2. "Since Redis 2.2 many data types are optimized to use less space up to a certain size." (Special encoding of small aggregate data types)
- They use up to 10 times less memory, 5 times on average. "are encoded in a very memory-efficient way that uses up to 10 times less memory (with 5 times less memory used being the average saving)." (Special encoding of small aggregate data types)
- Invisible to the user. "This is completely transparent from the point of view of the user and API." (Special encoding of small aggregate data types)
- It's a CPU/memory tradeoff with tunable limits. "Since this is a CPU / memory tradeoff it is possible to tune the maximum number of elements and maximum element size" (Special encoding of small aggregate data types)
- Defaults (Redis 7.0+): hash-max-listpack-entries 512, hash-max-listpack-value 64, zset-max-listpack-entries 128, zset-max-listpack-value 64, set-max-intset-entries 512; 7.2 adds set-max-listpack-entries 128 and set-max-listpack-value 64. Redis 6.2 and older used the name ziplist. (Special encoding, config blocks)
- Past the limit, Redis converts to the normal encoding. "If a specially encoded value overflows the configured max size, Redis will automatically convert it into normal encoding." (Special encoding of small aggregate data types)
- A small hash is a linear array of length-prefixed pairs; O(N) but N is small. "When hashes are small we can instead just encode them in an O(N) data structure, like a linear array with length-prefixed key-value pairs." (Using hashes to abstract ...)
- It's converted to a real hash table once it grows. "the hash will be converted into a real hash table as soon as the number of elements it contains grows too large" (Using hashes to abstract ...)
- The linear array is friendlier to the CPU cache than a hash table. "a linear array of key-value pairs happens to play very well with the CPU cache (it has a better cache locality than a hash table)." (Using hashes to abstract ...)
- Several keys cost more memory than one key holding a small hash. "a few keys use a lot more memory than a single key containing a hash with a few fields." (Using hashes to abstract ...)
- Use one hash per object instead of one key per field. "instead of using different keys for name, surname, email, password, use a single hash with all the required fields." (Use hashes when possible)
- If you raise the limits a lot, benchmark the conversion time. "if you change the setting in order to use specially encoded values for much larger aggregate types the suggestion is to run some benchmarks and tests to check the conversion time." (Special encoding of small aggregate data types)

## Visuals worth redrawing

None.

## My notes

- The thresholds changed name (ziplist to listpack) in 7.0; the limits
  stayed the same.
