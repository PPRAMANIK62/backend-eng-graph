---
id: row-level-security
title: Row-level security
depth: short
phase: 15
note: >-
  Postgres filtering rows per user inside the database.
needs: [multi-tenancy, sql]
leads_to: []
compare_with: [new-enemy-problem]
---


# Row-level security

Row-level security (RLS) lets Postgres decide, row by row, which rows
a query may see or change. You attach a policy to a table, and the
database adds its condition to every query that touches the table,
like a WHERE clause nobody can forget. It arrived in PostgreSQL 9.5,
and its most common use is keeping tenants apart in a shared
[[multi-tenancy|multi-tenant]] database.

## A policy is a WHERE clause the database adds

Take a pooled invoices table where every row carries a `tenant_id`.
The app sets the current tenant on each connection, and a policy
compares against it:

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- on each connection, for the tenant of the current request
SET app.current_tenant = '1cf1cc14-...';
```

Now a plain [[sql]] query like `SELECT * FROM invoices WHERE id = 42`
behaves as if it also said `AND tenant_id = <current tenant>`. The
policy's condition runs before any condition from the query itself, so
a user-supplied function in the WHERE clause can't peek at hidden rows
first.

What happens to rows the policy rejects depends on the command:

- **SELECT** returns them as if they weren't there. No error.
- **UPDATE and DELETE** skip them. Updating another tenant's invoice
  reports `UPDATE 0`.
- **INSERT** of a row that fails the policy raises an error.

Two expressions control this. `USING` filters the existing rows a
command can see. `WITH CHECK` tests the new rows an INSERT or UPDATE
would write. If you give only `USING`, it's used for both, so a tenant
can't insert a row for someone else or move a row to another tenant.

A table can have several policies. Permissive ones (the default) are
ORed: a row passes if any of them allows it. Restrictive ones are
ANDed on top: every one must pass. With RLS enabled and no policy at
all, the default is deny: nobody sees anything.

## Who it doesn't apply to

This is the part that bites. RLS is skipped entirely for:

- **Superusers** and roles with the `BYPASSRLS` attribute.
- **The table's owner**, unless you run
  `ALTER TABLE ... FORCE ROW LEVEL SECURITY`.

The owner is usually the role that ran the migrations. If your app
connects as that same role, which is common, your policies do nothing
and every query sees every tenant. Give the app its own role that
doesn't own the tables.

Views are another gap. A query through a view uses the view owner's
rights and policies, not the caller's, unless the view was created
with the `security_invoker` option. Since owners normally bypass RLS,
a view owned by the table's owner normally skips the table's policies
too.

## Where it gets tricky

**The tenant setting and connection pools.** The session variable
lives on the database connection. With a pool, the same connection
serves one tenant, then another, so the app must set the tenant every
time it takes a connection from the pool. A server-side pooler such as
PgBouncer may not work with session variables at all (see
[[db-connection-pooling]]). And since the tenant ID ends up inside a
SQL statement, build that statement safely; see [[sql-injection]].

**Constraints leak existence.** Unique [[constraints]] and foreign keys
are checked without RLS, so they can reveal rows you can't see. If an
insert fails on a unique key, the value exists somewhere. Use
generated surrogate keys rather than meaningful values where that
matters.

**Policies that read other tables can race.** A policy like "you can
see rows at or below your privilege level", which looks up your
level in a `users` table, can leak under
[[isolation-levels|READ COMMITTED]]. If an admin lowers your level
and then updates a row, a concurrent `SELECT ... FOR UPDATE` (a
[[explicit-locking|locking read]]) from you
can wait for the admin's transaction, then fetch the updated row
while still checking your old level. The Postgres manual walks
through this case; the fixes include `FOR SHARE` in the policy's
sub-SELECT or locking the lookup table while changing it. Policies
that only look at the row itself avoid the problem and are the
fastest.

**Not everything is covered.** `TRUNCATE` ignores policies. For
[[backups]], setting `row_security` to `off` doesn't bypass RLS; it makes
a query fail if a policy would have filtered it, so a dump can't
silently miss rows.

**Silence cuts both ways.** Because SELECT hides rows without an
error, a wrong policy looks like missing data, not a security bug.
Test policies by logging in as each role and checking what's visible
and what's writable.

## Further reading

- [5.9. Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), PostgreSQL 18 documentation. How RLS works, who bypasses it, the constraint side channel and the race with sub-SELECTs.
- [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html), PostgreSQL 18 documentation. USING vs WITH CHECK per command, permissive vs restrictive, and the notes on views and leakproof functions.
- [Multi-tenant data isolation with PostgreSQL Row Level Security](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/), Michael Beardsley, AWS, 2020. The tenant-per-session pattern, and the table-owner and pooling traps.

