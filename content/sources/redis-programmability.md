---
id: redis-programmability
title: Redis programmability (Redis docs)
author: Redis
url: https://redis.io/docs/latest/develop/programmability/
kind: docs
primary: true
---

## Summary

The overview page for server-side scripting in Redis: Eval scripts
(since 2.6.0) and Functions (since 7.0), the atomic execution
guarantee, read-only scripts, the sandbox, and what happens when a
script runs past the time limit.

## Key claims

- Two ways to run scripts: EVAL since 2.6.0, Functions since 7.0. "Firstly, and ever since Redis 2.6.0, the EVAL command enables running server-side scripts." (Running scripts)
- Functions are scripts stored in the database. "Secondly, added in v7.0, Redis Functions are essentially scripts that are first-class database elements." (Running scripts)
- Script execution is atomic and blocks everything else. "The script's execution blocks all server activities during its entire time, similarly to the semantics of transactions." (Running scripts)
- Other clients see all of a script's effects or none. "These semantics mean that all of the script's effects either have yet to happen or had already happened." (Running scripts)
- So slow scripts are a bad idea. "if you intend to use a slow script in your application, be aware that all other clients are blocked and can't execute any command while it is running." (Running scripts)
- The engine is Lua 5.1. "Presently, Redis supports a single scripting engine, the Lua 5.1 interpreter." (Background)
- Default maximum execution time is five seconds, set by busy-reply-threshold. "Scripts are subject to a maximum execution time (set by default to five seconds)." (Maximum execution time)
- Past the limit Redis doesn't kill the script, because that could leave half-written changes. "Interrupting the execution of a script has the potential of leaving the dataset with half-written changes." (Maximum execution time)
- Instead other clients get BUSY errors; only SCRIPT KILL, FUNCTION KILL and SHUTDOWN NOSAVE are allowed. "It starts accepting commands again from other clients but will reply with a BUSY error to all the clients sending normal commands." (Maximum execution time)
- Once a script has written, the only way out is SHUTDOWN NOSAVE. "If the script had already performed even a single write operation, the only command allowed is SHUTDOWN NOSAVE" (Maximum execution time)
- Read-only scripts (no-writes flag, EVAL_RO, FCALL_RO, since 7.0) can run on replicas and can always be killed. "They can always be executed on replicas." (Read-only scripts)
- SHUTDOWN NOSAVE stops the server without saving. "SHUTDOWN NOSAVE that stops the server without saving the current data set on disk (basically, the server is aborted)." (Maximum execution time)

## Visuals worth redrawing

None.

## My notes

- The page doesn't say in so many words that a script's writes are
  never undone; it follows from the time-limit section (a script that
  has written can't be stopped without throwing away the data set).
