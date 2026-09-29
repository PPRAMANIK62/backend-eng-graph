---
id: aws-postgres-rls-multi-tenant
title: "Multi-tenant data isolation with PostgreSQL Row Level Security"
author: Michael Beardsley (AWS)
url: https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/
kind: blog
primary: false
---

## Summary

An AWS database blog post (2020) on using Postgres row-level security
for the pool model: a tenant_id column on every table, a policy per
table, and a session variable holding the current tenant. Practical,
with the traps (table owners bypass RLS, pooling and session state).
Secondary for Postgres itself; AWS didn't build RLS.

## Key claims

- In a shared database the usual guard is a WHERE clause in every query. "is commonly implemented by hoping the correct WHERE clause is implemented in every SQL statement." (Data partitioning options)
- Silo, bridge, pool described: bridge is a schema per tenant on a shared instance; pool shares instance and namespace with a tenant key on every table. (Data partitioning options)
- RLS as an automatic WHERE clause. "You can think of an RLS policy as an automated WHERE clause that the database engine manages itself." (Row Level Security)
- RLS is in PostgreSQL 9.5 and newer. "PostgreSQL 9.5 and newer includes a feature called Row Level Security (RLS)." (Row Level Security)
- Filtered SELECTs return no error, just fewer rows; UPDATE/DELETE affect 0 rows; a failing INSERT errors. "There is no error or messaging from the enforcement of the security policy for SELECT statements." (Using RLS)
- If the app connects as the table owner, the policies don't apply. "If your application code connects to the database as the same PostgreSQL role as the table owner (usually the user that issued the CREATE TABLE statements unless later modified), your security policies aren’t in effect by default." (Some considerations when using RLS)
- A Postgres role per tenant doesn't scale; use a session variable instead: `USING (tenant_id = current_setting('app.current_tenant')::UUID)`. "If you use this mechanism, you need to create a PostgreSQL role for every tenant." (Some considerations; Alternative approach)
- Set the tenant every time a connection is taken from the pool. "This declaration should be made by your application code when you create the database connection or retrieve an existing one from your application connection pool." (Alternative approach)
- The variable is per session. "Because PostgreSQL scopes these variables to the current session, it’s safe to use them in a multi-connection application." (Alternative approach)
- Session variables and server-side poolers may not mix. "Using session variables may be incompatible with server-side connection pooling such as pgBouncer." (Alternative approach)
- Test views, functions and nested queries. "Be sure to thoroughly test functions, procedures, views and complex nested queries to make sure there are no unintended restrictions or permissions due to your policy definitions." (Example implementation)

## Visuals worth redrawing

None.

## My notes

- The post's Java example builds the SET statement by string
  concatenation with the tenant ID. If that value ever came from user
  input it would be SQL injection. The post names the built-in
  set_config function as an alternative to SET; calling it with a bound
  parameter avoids string building (check the signature in the
  Postgres manual before relying on it).
