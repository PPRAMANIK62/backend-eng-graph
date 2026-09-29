---
id: rails-optimistic-locking
title: "ActiveRecord::Locking::Optimistic (Rails 8.1.4 API)"
author: Rails core team
url: https://api.rubyonrails.org/classes/ActiveRecord/Locking/Optimistic.html
kind: docs
primary: true
---

## Summary

The Rails API docs for optimistic locking: add an integer lock_version
column and Active Record bumps it on every update and refuses to save a
record someone else changed since it was loaded. The source file
(activerecord/lib/active_record/locking/optimistic.rb, Rails main) shows
how: the old version goes in the UPDATE's WHERE clause and zero affected
rows means a conflict.

## Key claims

- What it does. "It does this by checking whether another process has made changes to a record since it was opened, an ActiveRecord::StaleObjectError exception is thrown if that has occurred and the update is ignored." (What is Optimistic Locking)
- It needs a lock_version column that each update increments. "Each update to the record increments the integer column lock_version and the locking facilities ensure that records instantiated twice will let the last one saved raise a StaleObjectError if the first was also updated." (Usage)
- You decide what to do on conflict. "You’re then responsible for dealing with the conflict by rescuing the exception and either rolling back, merging, or otherwise apply the business logic needed to resolve the conflict." (Usage)
- Across web requests, carry the version through the form. "To make it work across all web requests, the recommended approach is to add lock_version as a hidden field to your form." (Usage)
- In the source, the lock column's old value is merged into the update's conditions. "super.merge(locking_column => _lock_value_for_database(locking_column))" (optimistic.rb, _query_constraints_hash)
- And a row count other than one raises. "if affected_rows != 1" then "raise ActiveRecord::StaleObjectError.new(self, attempted_action)" (optimistic.rb, _update_row)

## Visuals worth redrawing

None.

## My notes

- The pessimistic alternative is ActiveRecord::Locking::Pessimistic
  (SELECT ... FOR UPDATE); not opened.
