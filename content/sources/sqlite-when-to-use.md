---
id: sqlite-when-to-use
title: Appropriate Uses For SQLite
author: SQLite developers
url: https://www.sqlite.org/whentouse.html
kind: docs
primary: true
---

## Summary

The SQLite team's own guide to when SQLite fits and when a
client/server database is better, ending in a four-question checklist.

## Key claims

- SQLite solves a different problem from client/server databases. "SQLite does not compete with client/server databases. SQLite competes with fopen()." (intro)
- Client/server databases aim at a shared central repository; SQLite at local storage for one application. "SQLite strives to provide local data storage for individual applications and devices." (intro)
- Works for most low to medium traffic websites; under 100K hits a day is a conservative figure. "Generally speaking, any site that gets fewer than 100K hits/day should work fine with SQLite." (1, Websites)
- Used as an application file format and as a local cache of an enterprise database. (1, Application file format; Cache for enterprise data)
- Server-side use: one database file per user, so each file sees one connection. "the server might have a separate SQLite database for each user" (1, Server-side database)
- Many clients over a network filesystem: use client/server; file locking there is often buggy and can corrupt the database. "file locking logic is buggy in many network filesystem implementations (on both Unix and Windows)." (2, Client/Server Applications)
- Busy or write-heavy sites needing several servers should use client/server. "if the website is write-intensive or is so busy that it requires multiple servers, then consider using an enterprise-class client/server database engine instead of SQLite." (2, High-volume Websites)
- Size limit 281 TB, in one file. "An SQLite database is limited in size to 281 terabytes" (2, Very large datasets)
- One writer at a time, unlimited readers. "SQLite supports an unlimited number of simultaneous readers, but it will only allow one writer at any instant in time." (2, High Concurrency)
- Writes usually take milliseconds so writers take turns. "But in most cases, a write transaction only takes milliseconds and so multiple writers can simply take turns." (3, checklist)
- A server process can coordinate far more write concurrency. "client/server database systems, because they have a long-running server process at hand to coordinate access, can usually handle far more write concurrency than SQLite ever will." (3, checklist)
- Checklist: data across a network from the app, many concurrent writers, or data too big for one file → client/server; otherwise SQLite. "Otherwise → choose SQLite!" (3)
- The 100K figure is conservative; SQLite has handled ten times that. "SQLite has been demonstrated to work with 10 times that amount of traffic." (1, Websites)
- Near the terabyte range, consider client/server. "when the size of the content looks like it might creep into the terabyte range, it would be good to consider a centralized client/server database." (2, Very large datasets)
- Network filesystem corruption comes from filesystem bugs SQLite can't prevent. "there is nothing SQLite can do to prevent it." (2, Client/Server Applications)
- An app server with the data on the same machine still counts as local. "then SQLite might still be appropriate even though the end user is another network hop away." (3, checklist, Nota Bene)

## Visuals worth redrawing

- The checklist as a small decision tree (section 3).

## My notes

- "Application" in the checklist means the code issuing SQL; an app
  server on the same machine as the file still counts as local.
