---
id: lwn-bpf-bounded-loops-2019
title: Bounded loops in BPF for the 5.3 kernel
author: Marta Rybczyńska (LWN.net)
url: https://lwn.net/Articles/794934/
kind: blog
primary: false
---

## Summary

An LWN article (2019) on how the BPF verifier learned to accept loops in
Linux 5.3: not by analysing loops specially, but by simulating every
iteration as more states, which became possible after the program size
limit was raised from 4096 instructions to one million in 5.2. It also
explains state pruning, the verifier's main trick for keeping that
affordable.

## Key claims

- Before 5.3, loops were not allowed at all. "Until recently, the verifier could not handle loops, meaning that all programs with loops were rejected." (The problem)
- Why the verifier cares: a program that doesn't end in bounded time is a denial of service. "if it does not complete in a bounded time, it could be used to carry out a denial-of-service attack on the system." (The problem)
- Developers worked around it by unrolling loops. "worked around it by unrolling loops (either by hand or using a compiler pragma)." (The problem)
- Loops merged for Linux 5.3. "This restriction was recently lifted by a patch set from Alexei Starovoitov that was merged for Linux 5.3." (intro)
- The size limit went from 4096 instructions to one million in 5.2. "instead of 4096 instructions, a program can execute up to one million." (The problem)
- Loops are checked by brute force: each iteration is just more states. "the verifier can simply simulate the iterations of a loop as a collection of states no different from any others." (The problem)
- State pruning: a state equivalent to one already verified needs no more work. "when it reaches a state that is equivalent to one that was already verified, it can conclude there is nothing more to do on that path, which can thus be pruned." (The BPF verifier)
- Developers still fight the verifier. "BPF developers will still have ample opportunity to complain about the remaining hoops they have to jump through to convince the verifier that their programs are safe." (Summary)
- The one-million limit arrived in 5.2. "increasing the size limitation for BPF programs in the 5.2 kernel" (The problem)

## Visuals worth redrawing

None.

## My notes

- Comments under the article argue whether the accepted language is
  Turing complete; not used.
