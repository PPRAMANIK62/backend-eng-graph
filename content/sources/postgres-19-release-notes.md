---
id: postgres-19-release-notes
title: "PostgreSQL 19 release notes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/19/release-19.html
kind: docs
primary: true
---

## Summary

Draft release notes for PostgreSQL 19, read while 19 was in beta (the
page carries no final release date yet). Used here for one change:
window functions gain the standard's IGNORE NULLS option.

## Key claims

- Window functions can ignore NULLs, for five functions. "Allow window functions to ignore NULLs with the IGNORE NULLS/RESPECT NULLS clause (Oliver Ford, Tatsuo Ishii)" and "Supported window functions are lead(), lag(), first_value(), last_value(), and nth_value()." (E.1.3.2 Query Commands)
- The devel docs for window functions (https://www.postgresql.org/docs/devel/functions-window.html) show the option, with RESPECT NULLS the default. "If unspecified, the default is RESPECT NULLS which includes NULL values in any result calculation." (9.22, devel)

## Visuals worth redrawing

None.

## My notes

- Beta, so the feature could still change before release. Re-check when
  19.0 ships.
