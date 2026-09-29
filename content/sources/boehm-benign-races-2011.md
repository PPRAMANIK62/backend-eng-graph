---
id: boehm-benign-races-2011
title: How to miscompile programs with "benign" data races
author: Hans-J. Boehm
url: https://www.usenix.org/legacy/events/hotpar11/tech/final_files/Boehm.pdf
kind: paper
primary: true
---

## Summary

HotPar 2011 paper by one of the designers of the C++ memory model.
Takes every kind of "benign" data race that earlier work said was safe
to ignore and shows how a reasonable compiler, or different hardware,
turns it into a wrong result. Even two threads writing the same value
can break.

## Key claims

- Data race definition. "We define a data race as simultaneous access to the same memory location by multiple threads, where at least one of the accesses modifies the memory location." (1 Background)
- Languages either make races errors with any outcome ("catch-fire", Ada 83, Posix threads, C++, C) or try to give them weak semantics (Java). (1 Background)
- No source-level race is safe to keep. "there is no reason to believe that a currently working program with “benign races” will continue to work when it is recompiled." (Abstract)
- Includes same-value writes. "Perhaps most surprisingly, this includes even the case of potentially concurrent writes of the same value by different threads." (Abstract)
- A race can be meaningful in assembly; locks are themselves written with races at that level. "In fact synchronization primitives are commonly implemented with assembly code that has data races." (2)
- Double-checked locking is broken at the source level: the compiler can reorder the data write and the flag write, or hoist the data read above the check. (2.1)
- A racy counter can be read torn: with 16-bit writes, a 32-bit counter going from 2^16 - 1 to 2^16 can read as zero. (2.2)
- A compiler may re-read a shared variable instead of spilling a local copy, so two tests of "the same" local see different values. (2.2)
- A compiler may load a racy flag once into a local (a register) and never read it again, turning a wait loop into an infinite one. "could even be transformed to the, now likely infinite, but sequentially equivalent, loop" (2.3)

## Visuals worth redrawing

None.

## My notes

- Matches the Go memory model's list of banned optimizations, which Go
  forbids and C/C++ allow.
