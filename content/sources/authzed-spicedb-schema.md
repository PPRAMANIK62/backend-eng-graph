---
id: authzed-spicedb-schema
title: "Schema Language Reference (SpiceDB documentation)"
author: AuthZed
url: https://authzed.com/docs/spicedb/concepts/schema
kind: docs
primary: true
---

## Summary

The reference for SpiceDB's schema language, a readable descendant of
Zanzibar's namespace configs: object type definitions, relations
(stored), permissions (computed) and the operators that combine them.

## Key claims

- A schema defines object types, relations and the permissions computed from them. "A SpiceDB schema defines the types of objects found within your application, how those objects can relate to one another, and the permissions that can be computed off of those relations." (intro)
- A relation can point at a set of subjects, e.g. document:budget#owner@group:finance#member. (Relations, Subject Relations)
- Wildcards grant to every user of a type; the docs warn to use them only for read permissions. "Only grant it to read permissions, unless you intend to allow for universal writing." (Wildcards)
- Relationships can only reference relations, not permissions, so permissions are cheap to change. "This means that it’s easy to change a permission, but not a relation." (Permissions)
- Four operations: union (+), intersection (&), exclusion (-) and arrow (->). "Permissions support four kinds of operations: union, intersection, exclusion and arrows." (Operations)
- Precedence trap: "For historical reasons, union (+) takes precedence over intersection (&) and exclusion (-), which can lead to unexpected results." (Operations, Important: Union Precedence)
- Arrow walks a relation to another object and uses a permission there, e.g. `permission read = reader + parent_folder->read`. "The expression parent_folder->read indicates to “walk” from the parent_folder of the document, and then to include the subjects found for the read permission of that folder." (Operations, Arrow)
- Without type checking, an impossible intersection silently returns false. "This is a bug that can go unnoticed for a long period of time, because the API call doesn’t return an error." (Typechecking)
- The `self` keyword arrived in SpiceDB v1.49.0. "Available in SpiceDB v1.49.0" (The self Keyword)

## Visuals worth redrawing

None.

## My notes

- Useful as the concrete syntax to show in the zanzibar article
  instead of the paper's protobuf-style config.
