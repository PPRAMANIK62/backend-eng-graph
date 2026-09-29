---
id: riak-data-types-concepts
title: "Concepts: Data Types (Riak KV 2.2.3)"
author: Basho Technologies
url: https://docs.riak.com/riak/kv/latest/learn/concepts/crdts/index.html
kind: docs
primary: true
---

## Summary

Riak KV's concept page for its built-in CRDTs (counters, flags,
HyperLogLogs, maps, registers, sets). The "latest" docs are for Riak KV
2.2.3. Clients send operations; underneath, the convergence is
state-based. The page has a table of which update wins under
concurrency for each type.

## Key claims

- Riak data types are CRDTs from Shapiro and colleagues' work. "Riak Data Types are convergent replicated data types (CRDTs), inspired by the work of Marc Shapiro, Nuno Preguiça, Carlos Baquero, and Marek Zawirski." (intro)
- Clients see operations, but the merge underneath is state-based. "Like CRDTs, the convergence logic is state-based behind the scenes." (intro)
- Instead of get and put you send operations, like telling a counter to add 5. "data types enable you to perform operations such as removing a register from a map, telling a counter to increment itself by 5, or enabling a flag that was previously disabled." (intro)
- Counters can't give unique IDs. "If you require unique, ordered IDs counters should not be used because uniqueness cannot be guaranteed." (Counters)
- You can't write your own merge. "The trade-off that data types necessarily present is that they don’t allow you to produce your own convergence logic." (Advantages and Disadvantages)
- Riak ships a context with the value, like a vector clock, to decide merges. "Riak KV does this by remembering the history of a value and broadcasting that history along with the current value in the form of a context object that is similar to a vector clock or dotted version vectors." (Convergence)
- Flags: enable wins over disable. "enable wins over disable" (Convergence Rules table)
- Registers: newest timestamp wins. "The most chronologically recent value wins, based on timestamps" (Convergence Rules table)
- Counters are PN-Counters; every increment and decrement counts. "Implemented as a PN-Counter (paper), so all increments and decrements by all actors are eventually applied." (Convergence Rules table)
- Sets: add wins. "If an element is concurrently added and removed, the add will win" (Convergence Rules table)
- Maps: add or update wins over remove. "If a field is concurrently added or updated and removed, the add/update will win" (Convergence Rules table)
- No strong consistency, fixed rules. "Riak Data Types are not perfect, particularly because they do not guarantee strong consistency and you cannot specify the rules yourself." (Convergence Rules)

## Visuals worth redrawing

None.

## My notes

- Riak KV's company, Basho, is gone; the docs are frozen at 2.2.3. Still the clearest production table of merge rules.
