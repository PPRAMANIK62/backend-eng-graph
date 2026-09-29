---
id: rails-guides-migrations
title: Active Record Migrations
author: Rails core team (Rails Guides)
url: https://guides.rubyonrails.org/active_record_migrations.html
kind: docs
primary: true
---

## Summary

The Rails guide to migrations, for Rails 8.1. Each migration is a file
that moves the schema one version forward; a table in the database
records which versions have run; the schema dump, not the pile of
migrations, is what you load to build a fresh database.

## Key claims

- Each migration is a new version of the database. "You can think of each migration as being a new 'version' of the database." (1. Migration Overview)
- The timestamp at the start of the file name sets the order. "Rails uses this timestamp to determine which migration should be run and in what order" (2.1 Creating a Standalone Migration)
- The schema_migrations table records what has run. "Rails keeps track of which migrations have been run through the schema_migrations table in the database." (4.8 Rails Migration Version Control)
- A row goes in after the migration runs. "When you run a migration, Rails inserts a row into the schema_migrations table with the version number of the migration, stored in the version column." (4.8)
- Each migration runs in a transaction when the database supports transactional DDL. "In databases that support DDL transactions, changing the schema in a single transaction, each migration is wrapped in a transaction." (4.1.1 Transactions)
- Without transactional DDL, a failed migration leaves its first half applied. "If the database does not support DDL transactions with statements that change the schema, then when a migration fails, the parts of it that have succeeded will not be rolled back." (4.1.1)
- Some statements can't run in a transaction; turn it off per migration. "There are queries that you can’t execute inside a transaction though, and for these situations you can turn the automatic transactions off with disable_ddl_transaction!" (4.1.1)
- Editing a migration that already ran does nothing: Rails thinks it ran. "Rails thinks it has already run the migration and so will do nothing when you run bin/rails db:migrate." (5. Changing Existing Migrations)
- Don't edit committed migrations; write a new one. "Instead, you should write a new migration that performs the changes you require." (5)
- The database, not the migrations, is the source of truth. "Migrations, mighty as they may be, are not the authoritative source for your database schema. Your database remains the source of truth." (6.1 What are Schema Files for?)
- Loading the schema file beats replaying history, and old migrations can break. "Old migrations may fail to apply correctly if those migrations use changing external dependencies or rely on application code which evolves separately from your migrations." (6.1)
- So old migration files can be deleted. "This makes it possible to delete or prune old migration files." (9. Old Migrations)
- Some changes can't be reversed; say so. "Sometimes your migration will do something which is just plain irreversible" (Reversing, IrreversibleMigration)
- The file name starts with a UTC timestamp. "contains a UTC timestamp identifying the migration followed by an underscore" (2.1 Creating a Standalone Migration)
- Rolling back a create_table migration removes the table. "if we roll this migration back, it will remove the table." (1. Migration Overview)
- The schema snapshot is db/schema.rb, or db/structure.sql for SQL format. (6.2 Types of Schema Dumps)
- Irreversible example: a migration that destroys data. "Sometimes your migration will do something which is just plain irreversible; for example, it might destroy some data." (3.13)

## Visuals worth redrawing

None.

## My notes

- File names start with a UTC timestamp; any other tool (Flyway) uses
  plain version numbers instead. Same idea: an order everyone agrees on.
