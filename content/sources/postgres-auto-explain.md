---
id: postgres-auto-explain
title: "PostgreSQL documentation, F.3 auto_explain"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/auto-explain.html
kind: docs
primary: true
---

## Summary

The contrib module that logs the plans of slow statements
automatically (read at version 18.6), and what its options cost.

## Key claims

- Logs plans of slow statements without running EXPLAIN by hand. "The auto_explain module provides a means for logging execution plans of slow statements automatically, without having to run EXPLAIN by hand." (F.3)
- Off by default; set log_min_duration. "Note that the default behavior is to do nothing, so you must set at least auto_explain.log_min_duration if you want any results." (F.3.1)
- log_min_duration is in milliseconds; -1 (default) disables. "-1 (the default) disables logging of plans." (F.3.1)
- log_analyze times every statement, logged or not. "This can have an extremely negative impact on performance." (F.3.1, log_analyze note)
- Turning off log_timing reduces the cost. "Turning off auto_explain.log_timing ameliorates the performance cost, at the price of obtaining less information." (F.3.1)
- sample_rate explains only a fraction of statements; default 1. (F.3.1)

## Visuals worth redrawing

None.

## My notes

- Superuser only for most settings.
