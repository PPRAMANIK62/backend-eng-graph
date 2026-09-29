---
id: postgres-glossary
title: "PostgreSQL documentation, Appendix M Glossary"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/glossary.html
kind: docs
primary: true
---

## Summary

The manual's glossary (read at version 18.6). Short, exact definitions
of every process in a running Postgres and of shared memory. The
easiest single place to see the whole architecture.

## Key claims

- The postmaster is the first process; it starts auxiliary processes and creates backends on demand. "It starts and manages the auxiliary processes and creates backend processes on demand." (Postmaster)
- A backend acts for one client session. "Process of an instance which acts on behalf of a client session and handles its requests." (Backend)
- Auxiliary processes list. "The auxiliary processes consist of the autovacuum launcher (but not the autovacuum workers), the background writer, the checkpointer, the logger, the startup process, the WAL archiver, the WAL receiver (but not the WAL senders), the WAL summarizer, and the WAL writer." (Auxiliary process)
- Background writer writes dirty pages from shared memory, spreading the I/O out. "An auxiliary process that writes dirty data pages from shared memory to the file system." (Background writer)
- Checkpointer runs checkpoints. "An auxiliary process that is responsible for executing checkpoints." (Checkpointer)
- WAL writer writes WAL records from shared memory to WAL files. "An auxiliary process that writes WAL records from shared memory to WAL files." (WAL writer)
- Autovacuum: a launcher plus workers that run vacuum and analyze. "A set of background processes that routinely perform vacuum and analyze operations." (Autovacuum)
- Startup process replays WAL in crash recovery and on replicas. "An auxiliary process that replays WAL during crash recovery and in a physical replica." (Startup process)
- Background workers run system or extension code, e.g. parallel query and logical replication. "Serves as infrastructure for several features in PostgreSQL, such as logical replication and parallel queries." (Background worker)
- An instance is processes sharing one shared memory area, managed by one postmaster. "A group of backend and auxiliary processes that communicate using a common shared memory area." (Instance)
- Shared memory mirrors parts of data files and holds WAL records in transit; the biggest part is shared buffers. "The largest part of shared memory is known as shared buffers and is used to mirror part of data files, organized into pages." (Shared memory)
- A modified page is dirty until written back. "When a page is modified, it is called a dirty page until it is written back to the file system." (Shared memory)
- The autovacuum launcher is always present unless autovacuum is disabled. "The auxiliary process that coordinates the work and is always present (unless autovacuum is disabled) is known as the autovacuum launcher" (Autovacuum)
- The logger writes the server log if enabled. "An auxiliary process which, if enabled, writes information about database events into the current log file." (Logger)
- The WAL archiver keeps WAL copies for backups or replicas. "saves copies of WAL files for the purpose of creating backups or keeping replicas current." (WAL archiver)
- The WAL summarizer serves incremental backups. "An auxiliary process that summarizes WAL data for incremental backups." (WAL summarizer)
- The WAL receiver runs on a replica. "An auxiliary process that runs on a replica to receive WAL from the primary server" (WAL receiver)
- Backend is easy to confuse with background worker and background writer. "(Don't confuse this term with the similar terms Background Worker or Background Writer)." (Backend)

## Visuals worth redrawing

- The process tree: postmaster, backends, auxiliary processes, all
  attached to shared memory.

## My notes

- The glossary doesn't list I/O workers; they come from io_method in
  19.4 (postgres-runtime-config-resource).
