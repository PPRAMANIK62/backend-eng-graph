---
id: redis-transactions-docs
title: Transactions (Redis docs)
author: Redis
url: https://redis.io/docs/latest/develop/using-commands/transactions/
kind: docs
primary: true
---

## Summary

The Redis docs page on MULTI, EXEC, DISCARD and WATCH, read when Redis
8.4 was the newest release it mentions. What a transaction guarantees
(isolation, all or nothing on EXEC), how errors behave, why there are
no rollbacks, and how WATCH gives optimistic check-and-set.

## Key claims

- No other client's command runs in the middle of a transaction. "A request sent by another client will never be served in the middle of the execution of a Redis Transaction." (intro)
- If the connection drops before EXEC, nothing runs. "if a client loses the connection to the server in the context of a transaction before calling the EXEC command none of the operations are performed" (intro)
- With AOF, a transaction is written with one write call, but a hard crash can still leave part of it; Redis then refuses to start until redis-check-aof removes it. "However if the Redis server crashes or is killed by the system administrator in some hard way it is possible that only a partial number of operations are registered." (intro)
- Commands after MULTI are queued, not run. "Instead of executing these commands, Redis will queue them." (Usage)
- Each queued command replies QUEUED. "all commands will reply with the string QUEUED" (Usage)
- EXEC returns one reply per command, in order. "EXEC returns an array of replies, where every element is the reply of a single command in the transaction, in the same order the commands were issued." (Usage)
- Errors while queueing (syntax, out of memory) make EXEC refuse the whole transaction, since Redis 2.6.5. "It will then refuse to execute the transaction returning an error during EXEC, discarding the transaction." (Errors inside a transaction)
- Errors at run time don't stop the other commands. "all the other commands will be executed even if some command fails during the transaction." (Errors inside a transaction)
- The example: SET a abc then LPOP a gives OK and a WRONGTYPE error in the same EXEC reply. (Errors inside a transaction)
- No rollbacks. "Redis does not support rollbacks of transactions since supporting rollbacks would have a significant impact on the simplicity and performance of Redis." (What about rollbacks?)
- WATCH makes EXEC conditional; a change to a watched key aborts it and EXEC returns a null reply. "If at least one watched key is modified before the EXEC command, the whole transaction aborts, and EXEC returns a Null reply to notify that the transaction failed." (Optimistic locking using check-and-set)
- The race WATCH fixes: two clients read 10 and both write 11. "So the final value will be 11 instead of 12." (Optimistic locking using check-and-set)
- On failure you retry. "This form of locking is called optimistic locking." (Optimistic locking using check-and-set)
- Retries are rare when clients mostly touch different keys. "In many use cases, multiple clients will be accessing different keys, so collisions are unlikely" (Optimistic locking using check-and-set)
- Redis 8.4 added compare-and-set on strings (SET with IFEQ/IFNE/IFDEQ/IFDNE) and compare-and-delete (DELEX). "Starting with version 8.4, Redis offers new atomic compare-and-set and compare-and-delete commands for string keys." (Optimistic locking using check-and-set)
- Changes by Redis itself (expiry, eviction) also trip WATCH; before 6.0.9 expiry didn't. "This includes modifications made by the client, like write commands, and by Redis itself, like expiration or eviction." (WATCH explained)
- EXEC unwatches everything, whether it ran or not. "When EXEC is called, all keys are UNWATCHed, regardless of whether the transaction was aborted or not." (WATCH explained)
- Scripts can do anything a transaction can, usually simpler and faster. "Everything you can do with a Redis Transaction, you can also do with a script, and usually the script will be both simpler and faster." (Redis scripting and transactions)

## Visuals worth redrawing

- None in the page; the WATCH race (two clients reading 10) is easy to
  draw as a timeline. Drawn in `redis-transactions`.

## My notes

- "Transaction" here means isolation plus all-or-nothing delivery of
  the queue on EXEC, not atomicity in the database sense: commands
  that fail at run time are not undone.
