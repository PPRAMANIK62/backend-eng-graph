---
id: django-query-expressions
title: "Query Expressions (Django 5.2 documentation)"
author: Django Software Foundation
url: https://docs.djangoproject.com/en/5.2/ref/models/expressions/
kind: docs
primary: true
---

## Summary

Django's reference for query expressions. The part used here is F(),
which makes the database compute a new value from the current column
value, and the section on how that avoids a lost update.

## Key claims

- F() avoids the race by letting the database do the update. "Another useful benefit of F() is that having the database - rather than Python - update a field’s value avoids a race condition." (Avoiding race conditions using F())
- Without it, two threads can lose an increment. "The value that the second thread saves will be based on the original value; the work of the first thread will be lost." (Avoiding race conditions using F())
- With it, the value used is the one in the database at save time. "it will only ever update the field based on the value of the field in the database when the save() or update() is executed, rather than based on its value when the instance was retrieved." (Avoiding race conditions using F())
- Gotcha: the F() assignment stays on the instance and is applied again on each save. "F() objects assigned to model fields persist after saving the model instance and will be applied on each save()." (F() assignments persist after Model.save())

## Visuals worth redrawing

None.

## My notes

None.
