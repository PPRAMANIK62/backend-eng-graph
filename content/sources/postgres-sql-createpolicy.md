---
id: postgres-sql-createpolicy
title: "CREATE POLICY (PostgreSQL 18 documentation)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/sql-createpolicy.html
kind: docs
primary: true
---

## Summary

Reference page for CREATE POLICY (read at version 18): USING vs WITH
CHECK, permissive vs restrictive, per-command rules (Table 300), and
notes on side channels, leakproof functions and views.

## Key claims

- USING filters existing rows; WITH CHECK tests new rows. "Existing table rows are checked against the expression specified in USING, while new rows that would be created via INSERT or UPDATE are checked against the expression specified in WITH CHECK." (Description)
- Hidden rows vanish silently; failed WITH CHECK is an error. "When a WITH CHECK expression returns true for a row then that row is inserted or updated, while if false or null is returned then an error occurs." (Description)
- Restrictive needs at least one permissive. "If only restrictive policies exist, then no records will be accessible." (Parameters, RESTRICTIVE)
- Policy expressions can't contain aggregate or window functions. "The conditional expression cannot contain any aggregate or window functions." (Parameters, using_expression)
- UPDATE usually needs SELECT rights too, so SELECT policies apply as well. (Per-Command Policies, UPDATE)
- Existence can leak through unique constraints and foreign keys. "If the insert fails then the user can infer that the value already exists." (Notes)
- Leakproof functions may run before the policy. "functions and operators marked by the system (or the system administrator) as LEAKPROOF may be evaluated before policy expressions, as they are assumed to be trustworthy." (Notes)
- Views run with the view owner's rights and policies unless created with security_invoker. "permission checks and policies for the tables which are referenced by a view will use the view owner's rights and any policies which apply to the view owner, except if the view is defined using the security_invoker option" (Notes)
- CREATE POLICY isn't standard SQL. "CREATE POLICY is a PostgreSQL extension." (Compatibility)
- Fix for the existence leak: surrogate keys. "or by using generated values (e.g., surrogate keys) instead of keys with external meanings." (Notes)

## Visuals worth redrawing

- Table 300: which policy (USING or WITH CHECK) applies to which command, filter vs check.

## My notes

- The view note matters for multi-tenant apps: a view owned by the
  table owner ignores the tenant policy unless security_invoker is set.
