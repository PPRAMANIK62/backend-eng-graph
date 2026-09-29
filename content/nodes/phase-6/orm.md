---
id: orm
title: ORMs
depth: short
phase: 6
note: >-
  What an ORM hides, and when that hurts.
needs: [n-plus-one]
leads_to: []
compare_with: [sql-injection]
---

# ORMs

An object-relational mapper (ORM) lets you work with database rows as
objects in your language: `Book.where(...)` in Rails, `Entry.objects.filter(...)`
in Django. It writes the [[sql]] for you, runs it, and turns the rows
into objects. That saves a lot of repetitive code. It also hides when
queries run, how many there are and what they look like, and that's
where the performance bugs live.

## What it does for you

A Rails query object does four things when you use it: turns your
method calls into a SQL query, sends it, builds one Ruby object per row
that comes back, and runs any callbacks you defined. Django's
QuerySets do the same. The interface looks the same whichever database
is underneath, so the same code runs on Postgres, MySQL or SQLite.

It also maps the other way, turning changes you make to objects back
into writes. Mapping in both directions is the hard part, and it's the
reason ORMs are big, complicated libraries.

## What it hides

**When a query runs.** A Django QuerySet can be built, filtered and
passed around without touching the database. It runs when you first
iterate over it, call `len()` or `list()` on it, or test it in an `if`.
So the line that looks like a query often isn't one, and a line that
doesn't look like a query often is.

**How many queries run.** Touching a related object that wasn't loaded
fires a query on the spot. In a loop, that's the [[n-plus-one]]
problem. Django adds a twist: a plain attribute like `entry.blog` is
cached on the object after the first load, but a method call like
`entry.authors.all()` queries again every time. Its template language
calls methods without parentheses, so the difference is invisible in
the template.

**How much work each query does.** `len(queryset)` loads every row to
count them in Python, where `count()` asks the database for
`SELECT COUNT(*)`. Testing a QuerySet in an `if` runs the whole query, where
`exists()` is cheaper. Both look like ordinary Python.

**What the SQL is.** The ORM picks joins, column lists and conditions.
To know whether a query can use an index you still have to see the
SQL, and ideally its plan (see [[explain]]).

## Why the mapping is hard

Objects in memory and rows in tables are two different shapes of the
same data. In memory you can use whatever structures you like; the
database has tables of rows linked by keys (see [[relational-model]]).
Either side can change, and the ORM has to reconcile them. Several
users can change the same rows at once, and the application can't
keep a database [[transaction]] open while it fiddles with objects in
memory.

That's why writing your own mapping layer usually goes worse than
people expect, and why most teams use an existing ORM. Martin Fowler's
estimate is that a good ORM handles 80 to 90 percent of the mapping,
and the rest needs someone who really understands the database.

## Where it gets tricky

**"Leaky abstraction" is the usual complaint, and it's true.** You
can't use an ORM well without knowing what SQL it writes. The two sides
of the argument disagree less than it sounds: the defenders say the
ORM is worth it for the boring 80 percent, as long as you don't pretend
it covers 100. Rails was built on the idea that you should know the
database anyway, and gives you ways back down to raw SQL when you need
them.

**Your object model bends toward tables.** To keep the mapping simple
you end up with objects that look a lot like rows. That's a fair price;
the alternative is more complicated mapping code.

**Reading is easier than writing.** An ORM is complicated because it
maps both ways. Code that only reads, like reports or a separate read
model (see [[cqrs]]), can often use plain SQL and skip the ORM.

**Optimising through an ORM needs checking.** Each trick (eager
loading, fetching only some columns, doing the work in the database)
can help or hurt depending on the data, and in some cases the usual
advice is reversed. Profile again after every change.

## What this means when you build

- Log the SQL your ORM sends in development. Django's
  `connection.queries` and `QuerySet.explain()` show what it writes and
  how the database runs it.
- Know which calls hit the database in your ORM: iteration, counting,
  truthiness, and touching unloaded relations.
- Push work into the database: filter, count and aggregate there, not
  in a loop in your code.
- Use the escape hatches. When the ORM can't express a query well,
  write the SQL yourself.

## Further reading

- [OrmHate](https://martinfowler.com/bliki/OrmHate.html), Martin Fowler, 2012. Why the mapping problem is hard, and a fair defence of ORMs against the usual complaints.
- [Database access optimization](https://docs.djangoproject.com/en/stable/topics/db/optimization/), Django docs, 6.1. A practical list of what an ORM hides and how to see and fix it.
- [QuerySet API reference](https://docs.djangoproject.com/en/stable/ref/models/querysets/), Django docs, 6.1. Exactly when a QuerySet hits the database.
- [Active Record Query Interface](https://guides.rubyonrails.org/active_record_querying.html), Rails guides, v8.1.4. What a Rails query object does with your method calls.
