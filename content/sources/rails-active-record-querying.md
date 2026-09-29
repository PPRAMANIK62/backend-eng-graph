---
id: rails-active-record-querying
title: "Active Record Query Interface (Rails Guides)"
author: Rails core team
url: https://guides.rubyonrails.org/active_record_querying.html
kind: docs
primary: true
---

## Summary

The Rails guide to querying with Active Record (guides for Rails
v8.1.4). Section 16 names the N + 1 queries problem with a books and
authors example and shows the three eager-loading methods and strict
loading.

## Key claims

- A Relation's job: build SQL, run it, turn each row into an object, run callbacks. "Convert the supplied options to an equivalent SQL query." (3, Retrieving Records from the Database)
- The same method-based interface works across MySQL, MariaDB, PostgreSQL and SQLite. "its method-based interface remains consistent regardless of which database you’re using." (1)
- The N+1 problem: one query for a list, then one per record. "Retrieving a list of records N (where N is a number greater that 1) in a single query can sometimes trigger N extra queries; one for each record." (16.1)
- Ten books and their authors run 11 queries. "The above code executes 1 (to find 10 books) + 10 (one per each book to load the author) = 11 queries in total." (16.1)
- includes picks preload or eager_load depending on the query. "Prefer using includes, as it is a higher-level method that will use either preload or eager_load depending on the query." (16.1.1)
- With includes or preload the example runs 2 queries, the second with `WHERE authors.id IN (1,2,...,10)`. "The above code will execute just 2 queries, as opposed to the 11 queries from the original case" (16.2, 16.3)
- preload runs one query per association. "With preload, Active Record loads each specified association using one query per association." (16.3)
- eager_load uses one query with a LEFT OUTER JOIN. "With eager_load, Active Record loads all specified associations using a LEFT OUTER JOIN." (16.4)
- includes with a condition on the association switches to a LEFT OUTER JOIN. "This will generate a query which contains a LEFT OUTER JOIN whereas the joins method will generate one using the INNER JOIN function instead." (16.2.1)
- strict_loading raises when an association would be lazily loaded. "By enabling strict loading mode on a relation, an ActiveRecord::StrictLoadingViolationError will be raised if the record tries to lazily load any association" (16.5)
- The :n_plus_one_only mode raises only on lazy loads that would cause N+1. (16.6)
- Violations can be logged instead of raised with action_on_strict_loading_violation = :log. (16.5)

## Visuals worth redrawing

None.

## My notes

- Also has a section on running `explain` from Active Record.
