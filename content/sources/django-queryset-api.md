---
id: django-queryset-api
title: "QuerySet API reference (Django documentation)"
author: Django Software Foundation
url: https://docs.djangoproject.com/en/stable/ref/models/querysets/
kind: docs
primary: true
---

## Summary

Django's reference for QuerySet (Django 6.1). Used for when a QuerySet
actually hits the database, and how select_related and
prefetch_related differ.

## Key claims

- A QuerySet doesn't touch the database until evaluated. "Internally, a QuerySet can be constructed, filtered, sliced, and generally passed around without actually hitting the database." (When QuerySets are evaluated)
- Iteration runs the query the first time. "A QuerySet is iterable, and it executes its database query the first time you iterate over it." (When QuerySets are evaluated)
- len() loads every row; count() is cheaper if you only need the number. "it’s much more efficient to handle a count at the database level using SQL’s SELECT COUNT(*)." (When QuerySets are evaluated)
- A boolean test runs the query; exists() is cheaper. "If you only want to determine if at least one result exists (and don’t need the actual objects), it’s more efficient to use exists()." (When QuerySets are evaluated)
- Plain access to a foreign key hits the database again. "# Hits the database again to get the related Blog object." (select_related example)
- select_related joins the related table into the same query. "select_related works by creating an SQL join and including the fields of the related object in the SELECT statement." (prefetch_related)
- It's limited to single-valued relations, to avoid a much larger result from joining a "many" side. "select_related is limited to single-valued relationships - foreign key and one-to-one." (prefetch_related)
- prefetch_related runs a separate lookup per relationship and joins in Python. "prefetch_related, on the other hand, does a separate lookup for each relationship, and does the ‘joining’ in Python." (prefetch_related)
- select_related() with no arguments is deprecated in 6.1. "Calling select_related() with no arguments is deprecated" (select_related)
- With no arguments it can return more data than needed. "This is not recommended in most cases as it is likely to make the underlying query more complex, and return more data, than is actually needed." (select_related)

## Visuals worth redrawing

None.

## My notes

None.
