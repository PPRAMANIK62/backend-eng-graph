---
id: sqlite
title: SQLite
depth: short
phase: 6
note: >-
  A database in a file inside your process. When that's enough.
needs: [relational-model]
leads_to: []
compare_with: [postgres-architecture]
---

# SQLite

SQLite is a full [[relational-model|relational]] SQL database that runs as a library inside your
program and keeps everything in one file. There's no server to install,
configure or connect to. It's the right choice far more often than
backend engineers assume, and the wrong one in a few specific cases
worth knowing.

## A database without a server

Most SQL databases, Postgres included, run as a separate server. Your
program sends SQL over a socket and gets rows back (see
[[postgres-architecture]]). SQLite skips all of that. Your program
links the SQLite library, opens a file, and the library reads and
writes that file directly, in the same process, thread and address
space as your code.

![Two setups side by side. Left: a client/server database. The app process sends SQL over a socket to a separate server process, which reads and writes its data files. Right: SQLite. The app process contains the SQLite library, which reads and writes a single database file directly, with no server and no network.](img/sqlite-vs-client-server.svg)

*Client/server vs a database inside your process. Adapted from SQLite developers, "SQLite Is Serverless".*

What you get: nothing to set up or run. Any program that can read the
disk can use the database, and the whole database is one file you can
copy. It competes with inventing your own file format and calling
`fopen()`, not with Postgres.

What you give up: a server is a separate process your code can't
corrupt, and a single long-running process can coordinate access with
finer-grained locking. SQLite has neither.

## One writer at a time

SQLite lets any number of readers in at once, but only one writer per
database file at a time. That sounds limiting, but most write
transactions take milliseconds, so writers simply queue up and take
turns.

By default SQLite uses a rollback journal. WAL mode, available since
version 3.7.0 (2010), gives more concurrency: readers don't block the
writer and the writer doesn't block readers.
It also needs fewer `fsync` calls. The catch is that every process
using the database has to be on the same machine, because WAL mode
relies on shared memory, and it adds two files (`-wal` and `-shm`) next
to the database.

## When SQLite is enough

The SQLite team's checklist comes down to three questions:

1. **Is the data on another machine from the code that runs the SQL?**
   Then use a client/server database. If your app server and the file
   are on the same machine, SQLite still counts, even though users
   reach the app over the network.
2. **Do many processes need to write at the same instant, and they
   can't take turns?** Then use a client/server database.
3. **Is the data too big for one file?** SQLite's limit is 281 TB, but
   once you're heading into terabytes, a client/server database is the
   safer bet.

Otherwise, SQLite is almost always the better answer. That covers
apps on phones and devices, desktop application files, local caches of
data from a central database, and most low to medium traffic websites.
The SQLite team's conservative figure is that a site with under
100,000 hits a day will be fine, and it has handled ten times that.

A server can also use SQLite as its storage, for example one database
file per user, so each file only ever sees one connection.

## Where it gets tricky

**Network filesystems.** Putting a SQLite file on a network share for
several machines to use is the classic mistake. It's slow, and file
locking on many network filesystems is buggy, so two clients can
modify the same part of the file at once and corrupt it. SQLite can't
prevent it, because the bug is in the filesystem. WAL mode doesn't work
across machines at all.

**"Serverless" means two things.** In SQLite's sense it means no server
process at all: the engine runs inside your program. Cloud providers
use the same word for a database run as a service on someone else's
machine, which is the opposite arrangement.

**Write-heavy, multi-server apps.** A site busy enough to need several
app servers, or one that's write-intensive, has outgrown a single file
on one machine.

## What this means when you build

- For a single-server app, a tool, a cache or a device, start with
  SQLite and move when one of the three checklist questions says so.
- Turn on WAL mode if readers and writers run at the same time.
- Keep write transactions short, since writers take turns.
- Never share a SQLite file across machines through a network
  filesystem.

## Further reading

- [Appropriate Uses For SQLite](https://www.sqlite.org/whentouse.html), SQLite developers. When SQLite fits, when it doesn't, and the checklist.
- [SQLite Is Serverless](https://www.sqlite.org/serverless.html), SQLite developers. What running without a server gains and costs.
- [Write-Ahead Logging](https://www.sqlite.org/wal.html), SQLite developers. How WAL mode changes concurrency, and its limits.
