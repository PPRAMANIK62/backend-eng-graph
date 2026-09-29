---
id: kernel-bpf-verifier
title: eBPF verifier (Linux kernel documentation)
author: Linux kernel developers
url: https://docs.kernel.org/bpf/verifier.html
kind: docs
primary: true
---

## Summary

The kernel's own description of the eBPF verifier: a control-flow check,
then a simulated run of every path that tracks the type and range of
every register and stack slot, rejecting any instruction that could read
uninitialised data, follow a bad pointer or go out of bounds. Points to
`kernel/bpf/verifier.c` for the details.

## Key claims

- Two steps. "The safety of the eBPF program is determined in two steps." (eBPF verifier)
- Step one: a graph check that rejects loops and unreachable code. "First step does DAG check to disallow loops and other CFG validation." (eBPF verifier)
- Step two: walk every path, simulating each instruction. "Second step starts from the first insn and descends all possible paths. It simulates execution of every insn and observes the state change of registers and stack." (eBPF verifier)
- Unwritten registers can't be read. "If register was never written to, it’s not readable" (eBPF verifier)
- Adding two pointers gives a plain number, not a pointer. "since addition of two valid pointers makes invalid pointer" (eBPF verifier)
- Loads and stores only through valid pointer types, bounds and alignment checked. "load/store instructions are allowed only with registers of valid types, which are PTR_TO_CTX, PTR_TO_MAP, PTR_TO_STACK. They are bounds and alignment checked." (eBPF verifier)
- Stack must be written before it's read. "The verifier will allow eBPF program to read data from stack only after it wrote into it." (eBPF verifier)
- Allowed helper calls depend on the program type, and argument types are checked. "The eBPF verifier will check that registers match argument constraints." (eBPF verifier)
- Different program types get different functions. "Socket filters may let programs to call one set of functions, whereas tracing filters may allow completely different set." (eBPF verifier)
- It tracks the range of possible values in every register and stack slot. "the verifier must track the range of possible values in each register and also in each stack slot." (Register value tracking)
- Map lookups may return NULL and must be checked before use. "map accesses (see BPF maps) return this type, which becomes a PTR_TO_MAP_VALUE when checked != NULL." (Register value tracking)

## Visuals worth redrawing

None.

## My notes

- The "DAG check to disallow loops" line predates bounded loops (Linux
  5.3, see lwn-bpf-bounded-loops-2019); the same page still has that
  wording. Treat the loop rule as "loops only if the verifier can prove
  they end".
