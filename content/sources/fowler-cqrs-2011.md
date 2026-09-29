---
id: fowler-cqrs-2011
title: CQRS
author: Martin Fowler
url: https://martinfowler.com/bliki/CQRS.html
kind: blog
primary: false
---

## Summary

A short bliki entry: CQRS means using a different model to update
information than to read it. Explains the variations (shared database,
separate databases), what it pairs with (task UIs, events, eventual
consistency), and warns that most systems shouldn't use it.

## Key claims

- CQRS was first described to Fowler by Greg Young. "It's a pattern that I first heard described by Greg Young." (intro)
- The core idea: a different model to update than to read. "At its heart is the notion that you can use a different model to update information than the model you use to read information." (intro)
- For most systems it adds risky complexity. "beware that for most systems CQRS adds risky complexity." (intro)
- The two models may share a database, or the query side may have its own database kept up to date by some mechanism. "However they may also use separate databases, effectively making the query-side's database into a real-time ReportingDatabase." (body)
- It pairs naturally with event sourcing and eventual consistency, but these are separate choices. "Having separate models raises questions about how hard to keep those models consistent, which raises the likelihood of using eventual consistency." (body)
- Use it only on specific parts of a system (a bounded context). "In particular CQRS should only be used on specific portions of a system (a BoundedContext in DDD lingo) and not the system as a whole." (When to use it)
- Benefits: some complex domains, and scaling reads and writes separately. "CQRS allows you to separate the load from reads and writes allowing you to scale each independently." (When to use it)
- Most cases Fowler saw went badly. "so far the majority of cases I've run into have not been so good" (When to use it)
- If only some queries are heavy, a reporting database may be enough. (When to use it)
- In the cases seen, CQRS often caused serious difficulties. "with CQRS seen as a significant force for getting a software system into serious difficulties." (When to use it)
- With a shared database, the database is the link between the models. "The in-memory models may share the same database, in which case the database acts as the communication between the two models." (body)

## Visuals worth redrawing

- The two sketches: one model for presentation and store, versus separate command and query models.

## My notes

- Fowler reports on the pattern; Young is the originator. primary: false.
