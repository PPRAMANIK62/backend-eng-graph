---
id: ostrovsky-cache-effects
title: Gallery of Processor Cache Effects
author: Igor Ostrovsky
url: http://igoro.com/archive/gallery-of-processor-cache-effects/
kind: blog
primary: false
---

## Summary

Seven small C# experiments that make cache behavior visible: cache lines,
cache sizes, instruction-level parallelism, associativity, false sharing.
Page shows it was published and updated in 2010.
His machine: quad-core, 32 KB L1 data per core, 4 MB L2 shared per pair.

## Key claims

- Touching every 16th int costs about the same as touching every int, because memory traffic dominates. "the two for-loops take about the same time : 80 and 78 ms respectively on my machine." (Example 1)
- CPUs fetch whole 64-byte cache lines. "they fetch memory in chunks of (typically) 64 bytes, called cache lines ." (Example 2)
- Other values in the same line are cheap once it's loaded. "accessing other values from the same cache line is cheap!" (Example 2)
- Running time drops at the cache sizes. "You can see distinct drops after 32kB and 4MB – the sizes of L1 and L2 caches on my machine." (Example 3)
- A write by one core invalidates the whole line in other cores' caches. "the entire cache line will be invalidated in all caches!" (Example 6)
- Four threads updating adjacent ints took 4.3 s; spaced 16 ints apart, 0.28 s. "if I call UpdateCounter with parameters 16,32,48,64 the operation will be done in 0.28 seconds !" (Example 6)
- False sharing makes the caches useless for those threads. "This kind of thread behavior effectively disables caches, crippling the program’s performance." (Example 6)

## Visuals worth redrawing

- Example 2 graph: time vs step size, flat 1 to 16 then halving.
- Example 6: four counters sharing one line vs spread over four lines.

## My notes

- Measurements are from one 2010 machine in C#. Good for the idea, not for numbers.
