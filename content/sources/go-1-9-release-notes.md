---
id: go-1-9-release-notes
title: Go 1.9 Release Notes
author: The Go Authors
url: https://go.dev/doc/go1.9
kind: docs
primary: true
---

## Summary

Release notes for Go 1.9. For clocks, the one change that matters: the
time package started carrying a monotonic clock reading inside every
Time value from time.Now().

## Key claims

- From Go 1.9, subtracting two time.Now() values is safe across wall-clock changes. "The time package now transparently tracks monotonic time in each Time value, making computing durations between two Time values a safe operation in the presence of wall clock adjustments." (Transparent Monotonic Time support)

## Visuals worth redrawing

None.

## My notes

- The current time package docs (go1.27.1 when read) spell out the rule:
  the wall clock is for telling time, the monotonic clock for measuring
  it. Not given a note.
