---
id: django-db-optimization
title: "Database access optimization (Django documentation)"
author: Django Software Foundation
url: https://docs.djangoproject.com/en/stable/topics/db/optimization/
kind: docs
primary: true
---

## Summary

Django's guide to using its ORM without wasted database work (Django
6.1): profile first, understand lazy QuerySets and attribute caching,
push work into the database, drop to raw SQL when needed, and fetch
related data in bulk.

## Key claims

- Profile first; use QuerySet.explain() and tools like django-debug-toolbar. "Use QuerySet.explain() to understand how specific QuerySets are executed by your database." (Profile first)
- Index maintenance can outweigh gains. "The overhead of maintaining an index may outweigh any gains in query speed." (Use standard DB optimization techniques)
- QuerySets are lazy; know when they're evaluated. "that QuerySets are lazy." (Understand QuerySet evaluation)
- Non-callable attributes like a foreign key are cached; callables like entry.authors.all() query every time. "But in general, callable attributes cause DB lookups every time" (Understand cached attributes)
- Templates call callables automatically, hiding that difference. "the template system does not allow use of parentheses, but will call callables automatically, hiding the above distinction." (Understand cached attributes)
- Do work in the database: filter, F expressions, annotate. (Do database work in the database rather than in Python)
- Escape hatches: RawSQL, then raw SQL; connection.queries shows what Django writes. "Use django.db.connection.queries to find out what Django is writing for you and start from there." (Use raw SQL)
- A query executed in a loop can turn into many queries where one would do. "This is particularly important if you have a query that is executed in a loop, and could therefore end up doing many database queries, when only one is needed." (Retrieve related objects efficiently)
- Use FETCH_PEERS, or select_related() and prefetch_related(). (Retrieve related objects efficiently)
- Every change comes with a caveat to profile again. "All of the suggestions below come with the caveat that in your circumstances the general principle might not apply, or might even be reversed." (Profile first)

## Visuals worth redrawing

None.

## My notes

- The QuerySet reference says select_related joins single-valued
  relations and prefetch_related runs one extra query per relation;
  not cited separately.
