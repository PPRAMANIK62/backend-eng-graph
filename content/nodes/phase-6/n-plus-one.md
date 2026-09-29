---
id: n-plus-one
title: The N+1 problem
depth: short
phase: 6
note: >-
  One query for the list, then one more per item.
needs: [sql]
leads_to: [orm]
compare_with: [joins, graphql, explain]
---

# The N+1 problem

The N+1 problem is when code runs one query to fetch a list, then one
more query for each item in it. Ten books and their authors become 11
queries instead of one or two. Each query is its own [[network-latency|round trip]] to the
database, so the page gets slower as the list gets longer, and it
usually hides inside code that looks perfectly innocent.

## How it happens

Here's the example from the Rails guide, printing the authors of ten
books:

```ruby
books = Book.limit(10)
books.each do |book|
  puts book.author.last_name
end
```

The first line runs one query for the books. Nothing in the loop looks
like a query, but `book.author` isn't loaded yet, so the first time
it's touched the [[orm]] quietly runs a query for that one book's
author. Ten books,
ten more queries: 1 + 10 = 11. With 500 books it's 501.

Django does exactly the same by default. When you touch a related
object that wasn't loaded, it fetches it for that one instance only,
which adds up to the same 1 + N queries.

The [[sql]] for the whole thing could have been one query. The problem
is that the code asks for data one row at a time, so the database
never gets the chance to do it in bulk.

![Two timelines between an app and a database. On the left, lazy loading: one query for 10 books, then ten separate author queries one after another, 11 round trips in total. On the right, eager loading: one query for the books and one query for all ten authors with an IN list, 2 round trips.](img/n-plus-one-round-trips.svg)

*Lazy loading pays one round trip per book; eager loading pays two in total. Adapted from the Rails guides, "Active Record Query Interface", section 16.*

## Three ways to fix it

All three ask for the related rows up front, in bulk.

**A join.** Fetch books and authors in one query with a [[joins|join]].
Rails' `eager_load` does it with a `LEFT OUTER JOIN`; Django's
`select_related` adds the join to the same query. One query in total.

**A second query with an IN list.** Fetch the books, collect their
author ids, then fetch all the authors at once:

```sql
SELECT books.* FROM books LIMIT 10;
SELECT authors.* FROM authors WHERE authors.id IN (1,2,3,4,5,6,7,8,9,10);
```

Rails' `preload` does this, as does Django's `prefetch_related`, which
matches the rows up in Python. Two queries, however long the list.
Rails' `includes` picks between the join and the second query for you
depending on the query.

**Batch the lazy load.** Django 6.1 added fetch modes. In
`FETCH_PEERS` mode, the first time you touch `book.author` Django loads
the author for every book that came from the same queryset in one
query. You get two queries without having to predict which relations
the code will touch.

## Catching it

The code doesn't look wrong, so you have to make the queries visible:

- **Count queries per request.** A page that runs a query count that
  grows with the number of rows shown has an N+1 somewhere. In logs it
  shows up as the same query shape repeated with different ids.
- **Make lazy loads fail.** Rails' `strict_loading` raises an error
  when a record tries to lazily load an association, and its
  `:n_plus_one_only` mode raises only when the lazy load would cause an
  N+1. Django's `FETCH_RAISE` mode raises instead of querying. Both let
  a test fail instead of a page going slow in production.

## Where it gets tricky

**A join isn't always better.** Joining a "many" relationship repeats
the parent's columns on every child row, so the result set can get much
larger. That's why Django only lets
`select_related` follow single-valued relations (foreign keys and
one-to-one) and uses a separate query for the rest. Two queries with an
IN list are often the better shape.

**Eager loading can overshoot.** Loading every relation "just in case"
fetches data nobody reads. Django 6.1 deprecated calling
`select_related()` with no arguments for this reason: it follows every
foreign key it can and returns more than needed.

**It isn't only an ORM problem.** Any loop that runs a query per item
does the same, hand-written SQL included. ORMs just make it easy to
write by accident.

**The database has its own loop.** A nested loop join in a query plan
also runs its inner side once per outer row (see [[explain]]). The
difference is that it happens inside the database, with no round trip
between each step. N+1 is the same pattern moved out into your
application, with the network in the middle.

## What this means when you build

- When you loop over rows and touch a relation inside the loop, load
  that relation up front.
- Prefer a second query with an IN list for "many" relations, and a
  join for single-valued ones.
- Turn on strict loading or `FETCH_RAISE` in development and tests, so
  N+1s fail loudly.
- Watch query counts per request, not just query times: 500 fast
  queries are still slow.

## Further reading

- [Active Record Query Interface](https://guides.rubyonrails.org/active_record_querying.html), Rails guides, v8.1.4. Section 16: the books and authors example, `includes`, `preload`, `eager_load` and strict loading.
- [Fetch modes](https://docs.djangoproject.com/en/stable/topics/db/fetch-modes/), Django docs, 6.1. The default fetch-one behaviour, `FETCH_PEERS` batching and `FETCH_RAISE`.
- [QuerySet API reference](https://docs.djangoproject.com/en/stable/ref/models/querysets/), Django docs, 6.1. How `select_related` and `prefetch_related` differ, and why joins are limited to single-valued relations.
