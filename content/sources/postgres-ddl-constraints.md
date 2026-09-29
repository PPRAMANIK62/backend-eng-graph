---
id: postgres-ddl-constraints
title: "PostgreSQL documentation, 5.5 Constraints"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/ddl-constraints.html
kind: docs
primary: true
---

## Summary

The Postgres manual's chapter on constraints (read at version 18.6):
check, not-null, unique, primary key, foreign key and exclusion
constraints, what each enforces, which ones build an index, and how
foreign keys react to deletes and updates.

## Key claims

- Constraints exist because data types are too coarse. "Data types are a way to limit the kind of data that can be stored in a table. For many applications, however, the constraint they provide is too coarse." (5.5)
- A violating write raises an error, even from a default. "If a user attempts to store data in a column that would violate a constraint, an error is raised. This applies even if the value came from the default value definition." (5.5)
- A check constraint is a Boolean expression on the row. "It allows you to specify that the value in a certain column must satisfy a Boolean (truth-value) expression." (5.5.1)
- Name constraints to get clearer errors. "This clarifies error messages and allows you to refer to the constraint when you need to change it." (5.5.1)
- A check passes on NULL. "It should be noted that a check constraint is satisfied if the check expression evaluates to true or the null value." (5.5.1)
- Checks may only look at the row itself. "PostgreSQL does not support CHECK constraints that reference table data other than the new or updated row being checked." (5.5.1, Note)
- Cross-row rules belong in unique, exclude or foreign keys. "If possible, use UNIQUE, EXCLUDE, or FOREIGN KEY constraints to express cross-row and cross-table restrictions." (5.5.1, Note)
- Checks are assumed immutable and only run on insert and update. "This assumption is what justifies examining CHECK constraints only when rows are inserted or updated, and not at other times." (5.5.1, Note)
- Most columns should be not null. "In most database designs the majority of columns should be marked not null." (5.5.2, Tip)
- A unique constraint creates a unique B-tree index. "Adding a unique constraint will automatically create a unique B-tree index on the column or group of columns listed in the constraint." (5.5.3)
- Two NULLs are not equal, so duplicates with NULL are allowed by default. "By default, two null values are not considered equal in this comparison." (5.5.3)
- NULLS NOT DISTINCT changes that. "This behavior can be changed by adding the clause NULLS NOT DISTINCT" (5.5.3)
- Other databases treat NULLs in unique constraints differently. "The default null treatment in unique constraints is implementation-defined according to the SQL standard, and other implementations have a different behavior." (5.5.3)
- A primary key means unique and not null. "This requires that the values be both unique and not null." (5.5.4)
- A primary key builds a unique B-tree index. "Adding a primary key will automatically create a unique B-tree index on the column or group of columns listed in the primary key, and will force the column(s) to be marked NOT NULL." (5.5.4)
- One primary key per table; theory says every table needs one, Postgres doesn't force it. "Relational database theory dictates that every table must have a primary key. This rule is not enforced by PostgreSQL, but it is usually best to follow it." (5.5.4)
- The primary key is the default target of foreign keys. "the primary key defines the default target column(s) for foreign keys referencing its table." (5.5.4)
- A foreign key keeps referential integrity. "A foreign key constraint specifies that the values in a column (or a group of columns) must match the values appearing in some row of another table." (5.5.5)
- ON DELETE NO ACTION is the default and usually errors; it can be deferred. "The default ON DELETE action is ON DELETE NO ACTION; this does not need to be specified." (5.5.5)
- RESTRICT can't be deferred. "RESTRICT does not allow the check to be deferred until later in the transaction." (5.5.5)
- CASCADE deletes the referencing rows. "CASCADE specifies that when a referenced row is deleted, row(s) referencing it should be automatically deleted as well." (5.5.5)
- When to use CASCADE vs RESTRICT: part-of vs independent things. "When the referencing table represents something that is a component of what is represented by the referenced table and cannot exist independently, then CASCADE could be appropriate." (5.5.5)
- A NULL in a referencing column skips the check (unless MATCH FULL). "Normally, a referencing row need not satisfy the foreign key constraint if any of its referencing columns are null." (5.5.5)
- The referencing side is not indexed automatically; deletes on the parent scan it. "the declaration of a foreign key constraint does not automatically create an index on the referencing columns." (5.5.5)
- Why index it anyway. "Since a DELETE of a row from the referenced table or an UPDATE of a referenced column will require a scan of the referencing table for rows matching the old value, it is often a good idea to index the referencing columns too." (5.5.5)
- Exclusion constraints generalize unique to any operator. "Exclusion constraints ensure that if any two rows are compared on the specified columns or expressions using the specified operators, at least one of these operator comparisons will return false or null." (5.5.6)
- ON UPDATE CASCADE copies a changed key into every referencing row. "In this case, CASCADE means that the updated values of the referenced column(s) should be copied into the referencing row(s)." (5.5.5)
- A deferred NO ACTION check lets other statements fix things first. "In that case, the NO ACTION setting would allow other commands to “fix” the situation before the constraint is checked, for example by inserting another suitable row into the referenced table or by deleting the now-dangling rows from the referencing table." (5.5.5)
- A CHECK that reads other rows can break dump and restore. "This would cause a database dump and restore to fail." (5.5.1, Note)
- For a one-time check against other rows at insert, use a trigger. "If what you desire is a one-time check against other rows at row insertion, rather than a continuously-maintained consistency guarantee, a custom trigger can be used to implement that." (5.5.1, Note)
- A foreign key must point at a primary key or unique columns. "A foreign key must reference columns that either are a primary key or form a unique constraint, or are columns from a non-partial unique index." (5.5.5)
- NO ACTION lets the delete proceed but the constraint must still hold. "This means that the deletion in the referenced table is allowed to proceed. But the foreign-key constraint is still required to be satisfied, so this operation will usually result in an error." (5.5.5)
- SET NULL and SET DEFAULT. "These cause the referencing column(s) in the referencing row(s) to be set to nulls or their default values, respectively, when the referenced row is deleted." (5.5.5)

## Visuals worth redrawing

None. The products / orders / order_items example is a good shape for a
foreign key figure.

## My notes

- Deferred checking is only mentioned here ("not covered in this
  chapter"); the details are in CREATE TABLE (postgres-create-table).
