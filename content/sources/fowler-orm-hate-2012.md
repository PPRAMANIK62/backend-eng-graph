---
id: fowler-orm-hate-2012
title: OrmHate
author: Martin Fowler
url: https://martinfowler.com/bliki/OrmHate.html
kind: blog
primary: false
---

## Summary

Martin Fowler's 2012 defence of object-relational mappers against the
usual complaints. The mapping problem is hard because data lives in two
different shapes and changes on both sides; an ORM does most of the
boring work, but the rest needs someone who knows the database.

## Key claims

- The charges: complex, a leaky abstraction, and slow through naive database use. "The charges against them can be summarized in that they are complex, and provide only a leaky abstraction over a relational data store." (opening)
- The real problem is keeping two representations in sync. "Essentially what you are doing is synchronizing between two quite different representations of data, one in the relational database, and the other in-memory." (opening)
- Changes on both sides, plus concurrency, and you can't hold a transaction open while working in memory. "you can't hold transactions open while you fiddle with the data in-memory." (opening)
- Home-grown ORMs were worse. "it was always much tougher than people imagined." (A better solution)
- ORMs handle most of the mapping; the rest needs database knowledge. "Essentially the ORM can handle about 80-90% of the mapping problems, but that last chunk always needs careful work by somebody who really understands how a relational database works." (A better solution)
- Active Record gives ways down to SQL. "it takes care of boring stuff, but provides manholes so you can get down with the SQL when you have to." (A better solution)
- A more relational in-memory model is a reasonable price. "you either have to make your in-memory model more relational, or you complicate your mapping code." (A better solution)
- Read-only access is simpler without a full ORM. "ORMs are complex because they have to handle a bi-directional mapping." (A better solution)
- The mistake is pretending the ORM covers everything. "The problem is in me for pretending it's 100% when it isn't." (A better solution)
- Active Record was designed on the view that you should know the database. "if you are writing an application backed by a relational database you should damn well know how a relational database works." (A better solution, on David Heinemeier Hansson)

## Visuals worth redrawing

None.

## My notes

- Opinion piece; use it for the argument, not for facts about any
  specific ORM.
