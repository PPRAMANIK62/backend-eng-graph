---
id: django-fetch-modes
title: "Fetch modes (Django documentation)"
author: Django Software Foundation
url: https://docs.djangoproject.com/en/stable/topics/db/fetch-modes/
kind: docs
primary: true
---

## Summary

Django 6.1's page on fetch modes, which control what happens when code
touches a related object or deferred field that wasn't loaded. It names
the N+1 queries problem and adds a mode that batches the lazy load for
every object from the same queryset.

## Key claims

- Fetch modes are new in Django 6.1. "New in Django 6.1." (top)
- FETCH_ONE is the default and fetches only for the current instance. "Fetches the missing field for the current instance only. This is the default mode." (FETCH_ONE)
- That gives 1+N queries, the N+1 problem. "This query pattern is known as the “N+1 queries problem” because it often leads to performance issues when N is large." (FETCH_ONE)
- FETCH_PEERS fetches the field for all instances from the same queryset in one query. "Fetches the missing field for the current instance and its “peers”—instances that came from the same initial QuerySet." (FETCH_PEERS)
- Result: 2 queries in total. "Using FETCH_PEERS can reduce most cases of the “N+1 queries problem” to two queries without much effort." (FETCH_PEERS)
- FETCH_RAISE raises an exception instead of querying. "This mode can prevent unintentional queries in performance-critical sections of code." (FETCH_RAISE)
- The mode is copied to related objects, so it covers a whole tree. "Django copies the fetch mode of an instance to any related objects it fetches, so the mode applies to a whole tree of relationships" (top)

## Visuals worth redrawing

None.

## My notes

- Earlier Django versions only had select_related and prefetch_related
  for this; FETCH_ONE is how Django always behaved.
