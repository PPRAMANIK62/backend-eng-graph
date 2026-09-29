---
id: race-condition
title: Race conditions
depth: deep
phase: 4
note: >-
  When the result depends on timing: data races on memory, and check-
  then-act races on anything shared, like files or rows.
needs: [thread]
leads_to: [mutex, memory-model, race-detector, lost-update]
compare_with: []
---

# Race conditions

A race condition is a bug where the result depends on timing: which
thread, [[process]] or request happens to run first. The same code passes a
thousand test runs and fails on the next one, or only under load. Any
time two things share state, whether a variable, a file or a database
row, you have to decide who may touch it when, or the scheduler decides
for you.

## Two kinds of race

People use "race" for two different bugs, and it helps to keep them
apart from the start.

A **data race** is a precise, low-level thing. Two [[thread|threads]]
touch the same memory location at the same time, at least one of them
writes, and nothing orders the two accesses. Two threads that only read
can't race; there has to be a write. The shared counter that loses
increments is the standard example: `counter = counter + 1` is a load,
an add and a store, and a switch in the middle loses one thread's
update.

A **race condition** in the wider sense is a logic bug: the program
assumes that two steps happen together, or in a certain order, and
nothing makes them. The most common shape is **check-then-act**. You
look at some state, decide based on it, then act, and in between
someone else changes the state. This kind needs no shared memory at
all. Two processes and a file will do, or two requests and a database
row.

You can have either without the other. A check-then-act bug where each
step holds a lock has no data race, but it's still wrong. And a data
race can be harmful even when the logic looks fine, as the next
sections show.

## A check that is stale by the time you use it

Here's a real bug from MySQL, found in a study of concurrency bugs in
MySQL, Apache, Mozilla and OpenOffice. One thread checks that a pointer
isn't NULL, then prints the string it points to. Another thread sets
the pointer to NULL.

![A trace in three columns: thread 1, thread 2, and the value of thd->proc_info. Thread 1 checks that proc_info is not NULL and goes on. The scheduler switches to thread 2, which sets proc_info to NULL. Thread 1 resumes, still trusting its check, and calls fputs with proc_info, which is now NULL, and crashes.](img/race-condition-check-then-act.svg)

*An atomicity violation: the check and the use were meant to happen as one step. Adapted from Remzi and Andrea Arpaci-Dusseau, "Common Concurrency Problems" (Operating Systems: Three Easy Pieces, ch. 32), which takes it from Lu et al.'s bug study.*

Each line is fine on its own. The bug is the gap between them. The
study's name for it is an **atomicity violation**: a group of accesses
that was meant to be atomic, but nothing enforced it.

Its sibling is the **order violation**: A must happen before B, and
nothing makes it so. In the Mozilla example, one thread creates a
thread and stores its handle in a variable; the new thread reads that
variable right away, and if it runs first, it reads NULL.

These two patterns are most of what goes wrong in practice. In that
study, 74 of the 105 concurrency bugs weren't [[deadlock|deadlocks]], and 97% of
those were atomicity or order violations.

## The same race outside your process

Check-then-act doesn't care what the shared thing is. With files it
has a name, **time-of-check to time-of-use (TOCTOU)**, and a security
history.

The classic case is a privileged program that calls `access()` to check
whether the user may write a file, then calls `fopen()` on the same
name. Both calls take a file name, not an open
[[file-descriptor|file descriptor]]. Between them, an
attacker replaces the file with a symbolic link to something they
couldn't normally write, and the program writes it with its own
privileges.

The everyday version is less dramatic:

```text
if the lock file doesn't exist:
    create the lock file
```

Two processes can both see "doesn't exist" and both create it. The fix
is to make the check and the action one operation. On Linux,
`open()` with `O_CREAT | O_EXCL` does exactly that: it creates the file,
or fails with `EEXIST` if it's already there, as a single step, and it
won't follow a symbolic link at that path. The same idea is behind
[[atomic-rename]] for replacing a file, and behind `O_APPEND`, which
moves to the end of the file and writes in one step.

A database row is the same story. Read a balance, decide, write a new
balance: two requests doing that at once can lose one write. That's
the [[lost-update]], and the database has its own tools for it.

A lock inside your process can't help with any of these. The other
side is another process, or another machine.

## Why a data race is worse than a lost update

It's tempting to think a data race just means "sometimes you get the
old value, sometimes the new one". Some races look harmless on that
reading: a flag that's set once, a counter that's only for statistics,
two threads writing the same value.

The trouble is that the compiler and the CPU assume your program has
no data races, and optimize on that basis. A compiler may keep a
variable in a register instead of reading it again, reorder two writes
that look independent, or read a shared variable twice where your code
reads it once. For code without races, none of that is visible. With a
race, you can see results that no ordering of your source lines could
produce:

- A counter read while it's being written can come back torn. If the
  hardware only writes 16 bits at a time, a 32-bit counter going from
  65,535 to 65,536 can be read as zero.
- A local copy of a shared variable can be silently replaced by a
  second read of the shared variable, so two checks of "the same" value
  disagree.
- A "done" flag set after writing some data can be seen before the
  data is. How that happens is [[memory-model]].

What a racy program is allowed to do depends on the language. In C and
C++ a data race is undefined behavior: the program's meaning is
undefined, and the compiler may do anything at all. Go is stricter about
what can happen. A read of a word-sized value must return some value
that was really written. Go still calls every race a bug, though: a
race on an interface, slice, map or string, which are several words
each, can mix two writes and corrupt memory.

So there's no such thing as a safe data race in source code. Even
racing writes of the same value have been shown to go wrong after
reasonable compiler changes. A program with a "harmless" race works
with today's compiler, and has no reason to keep working with the next
one.

## How to fix one

There are three ways out, and every tool in this part of the graph is
one of them.

1. **Make the pair one atomic step.** `O_CREAT | O_EXCL` for files, a
   rename for replacing a file, an atomic compare-and-swap in memory
   (see [[lock-free-structures]]).
2. **Hold a lock across both steps.** A [[mutex]] around the check
   *and* the act, not around each one. For files the advice is the
   same: take the lock before the check, so the thing you checked is
   the thing you use.
3. **Don't share.** Give each piece of data one owner at a time, and
   hand it over instead of sharing it. That's [[message-passing]].

For order violations the tool is different: something that waits, like
a condition variable or a channel receive, so B can't start until A has
said it's done.

## Where it gets tricky

**Race-free is not the same as correct.** A race detector finds data
races. Wrap the check and the use in two separate lock sections and the
data race is gone, while the check-then-act bug stays. The lock has to
cover the whole decision.

**Races hide.** The bad interleaving needs a switch at exactly the
wrong moment, and nothing makes that moment come up in a test. A
passing test proves little. Tools like Go's `-race` report data races
they see while the program runs; what they can and can't catch is
[[race-detector]].

**"Benign" is a claim about one compiler.** Races that looked safe in
the machine code of one build aren't safe at the source level. Treat
every data race as a bug, which is what C, C++ and Go all say.

**Checks across processes can't be made safe with in-process tools.**
A mutex, an atomic and a race detector all stop at your process's
memory. Files, rows and remote services need atomic operations from the
system that owns them.

## What this means when you build

- For every piece of shared state, write down its rule: owned by one
  thread, read-only after setup, or guarded by a named lock.
- When you see "if X then do Y" on shared state, ask what happens if X
  changes in between. Make it one atomic operation or hold one lock
  across both.
- Use the system's atomic operations for things outside your process:
  `O_EXCL`, rename, a single SQL statement or a [[transaction]].
- Run tests with the race detector on. The phase 4 lab harness is
  planned around it.
- Don't keep a data race because it "can't matter".

## Further reading

- [Concurrency: An Introduction (Operating Systems: Three Easy Pieces, ch. 26)](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf), Remzi and Andrea Arpaci-Dusseau, 2023. The shared-counter race, step by step.
- [Common Concurrency Problems (Operating Systems: Three Easy Pieces, ch. 32)](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf), Remzi and Andrea Arpaci-Dusseau, version 1.20. Atomicity and order violations from real code, and how common they are.
- [The Go Memory Model](https://go.dev/ref/mem), The Go Authors, 2022. The exact definition of a data race, and what a racy Go program may still do.
- [How to miscompile programs with "benign" data races](https://www.usenix.org/legacy/events/hotpar11/tech/final_files/Boehm.pdf), Hans-J. Boehm, 2011. Why every kind of "harmless" race can break after recompiling.
- [CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition](https://cwe.mitre.org/data/definitions/367.html), MITRE. Check-then-act on files as a security bug, with examples and fixes.
- [open(2)](https://man7.org/linux/man-pages/man2/open.2.html), Linux man-pages, 2026. `O_EXCL` and `O_APPEND`, the atomic file operations.
