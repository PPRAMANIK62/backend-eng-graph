---
id: hebert-queues-dont-fix-overload-2014
title: Queues Don't Fix Overload
author: Fred Hebert
url: https://ferd.ca/queues-don-t-fix-overload.html
kind: blog
primary: false
---

## Summary

A 2014 essay by the author of Erlang in Anger. A system has a hard limit
somewhere (a database, disk, an API); adding a queue in front of it
absorbs short bursts but not sustained overload, and only postpones the
failure while making it bigger. You have to choose what gives: block
the input (backpressure) or drop work (load shedding).

## Key claims

- Under prolonged overload, buffers stop helping. "All of a sudden, the buffers, queues, whatever, can't deal with it anymore." (the sink story)
- The two choices. "You'll have to pick between blocking on input (back-pressure), or dropping data on the floor (load-shedding)." (middle)
- In most software the backpressure is implicit: things just get slow. "Usually the back-pressure in the system is implicit: 'tis slow." (middle)
- That slowness is what keeps the stack alive. "It's what is likely keeping your whole stack alive." (middle)
- Adding a queue makes it fast again, until the queue spills over. "Except at some point the queue spills over, and you lose all of the data." (middle)
- The fix: find the bottleneck and ask it for permission. "Step 1. Identify the bottleneck. Step 2: ask the bottleneck for permission to pile more data in" (near the end)
- A blind queue makes failures rarer but bigger. "You're making failures more rare, but you're making their magnitude worse." (near the end)
- Callers cope better with an idempotent API they can retry. "a proper idempotent API with end-to-end principles in mind will make it so these instances of back-pressure and load shedding should rarely be a problem for your callers" (near the end)

## Visuals worth redrawing

- The sink: faucet (input), basin (queue), drain (the bottleneck, "red
  arrow"). The drain's size sets the real throughput.

## My notes

- Opinion piece, not measurement. Good for the argument, not numbers.
