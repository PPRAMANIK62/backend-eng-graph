---
id: postgres-10-release-notes
title: "PostgreSQL 10 release notes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/release/10.0/
kind: docs
primary: true
---

## Summary

Release notes for PostgreSQL 10.0 (2017). Relevant here: hash indexes
became WAL-logged, so crash-safe and replicated.

## Key claims

- Hash indexes got WAL support. "Add write-ahead logging support to hash indexes (Amit Kapila)" (E.24.3.1.2 Indexes)
- That made them safe to use. "This makes hash indexes crash-safe and replicatable. The former warning message about their use is removed." (E.24.3.1.2 Indexes)
- Hash indexes from older versions must be rebuilt after upgrading. "Hash indexes must be rebuilt after pg_upgrade-ing from any previous major PostgreSQL version" (E.24.2 Migration to Version 10)

## Visuals worth redrawing

None.

## My notes

- Old advice to avoid hash indexes dates from before this release.
