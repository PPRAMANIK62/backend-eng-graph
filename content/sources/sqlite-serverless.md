---
id: sqlite-serverless
title: SQLite Is Serverless
author: SQLite developers
url: https://www.sqlite.org/serverless.html
kind: docs
primary: true
---

## Summary

What "serverless" means for SQLite: no separate server process, the
application reads and writes the database file itself. Lists the
upside (nothing to run or configure) and the downside (no process to
protect or coordinate).

## Key claims

- No server process; the application reads and writes the files directly. "With SQLite, the process that wants to access the database reads and writes directly from the database files on disk." (1)
- Advantage: nothing to install or manage. "The main advantage is that there is no separate server process to install, setup, configure, initialize, manage, and troubleshoot." (1)
- A server protects data from client bugs. "stray pointers in a client cannot corrupt memory on the server." (1)
- A server can lock more finely. "allowing for finer-grained locking and better concurrency." (1)
- "Classic serverless" means same process, thread and address space as the application. "The database engine runs within the same process, thread, and address space as the application." (2)
- "Neo-serverless" means a hosted database service that still uses a server. "even if it really does use a server under the covers." (2, Neo-Serverless)

## Visuals worth redrawing

- Application with the SQLite library inside vs application talking to a
  server over a socket.

## My notes

None.
