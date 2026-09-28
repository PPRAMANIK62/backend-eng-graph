---
id: ostep-process-api
title: "Interlude: Process API (Operating Systems: Three Easy Pieces, ch. 5)"
author: Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-api.pdf
published: 2023
accessed: 2026-09-28
kind: book
primary: false
---

## Summary

Walks through fork(), wait() and exec() with small C programs and explains
why Unix splits process creation into fork then exec: the gap between the
two is where a shell sets up redirection and the like. Version 1.10.

## Key claims

- exec loads a different program over the current one; heap and stack start fresh. "the heap and stack and other parts of the memory space of the program are re-initialized." (5.3)
- A successful exec never returns. "a successful call to exec() never returns." (5.3)
- Splitting fork and exec lets the shell run code in between. "it lets the shell run code after the call to fork() but before the call to exec()" (5.4)
- A shell forks a child, execs the command in it, then waits for it. "calls fork() to create a new child process to run the command, calls some variant of exec() to run the command, and then waits for the command to complete by calling wait()." (5.4)
- Redirection like `wc p3.c > newfile.txt` works because the child changes its standard output before exec. (5.4, example)

## Visuals worth redrawing

None needed; the code listings (p1.c to p4.c) do the teaching.

## My notes

- Six exec variants on Linux (execl, execlp, execle, execv, execvp, execvpe), footnote 3.
