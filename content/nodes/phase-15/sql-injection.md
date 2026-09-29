---
id: sql-injection
title: SQL injection
depth: short
phase: 15
note: >-
  User input run as SQL, and parameterized queries.
needs: [sql]
leads_to: []
compare_with: [validation-at-boundary, orm]
---

# SQL injection

SQL injection happens when input from a user becomes part of the text
of a [[sql|SQL]] statement, so the database runs it as code. It's still
very common, and the fix is almost always the same: send values to the database as parameters, separate from the SQL.

## Where code and data get mixed

Here's a lookup built by gluing strings together:

```go
q := "SELECT balance FROM accounts WHERE owner = '" + name + "'"
```

With `name = "alice"` it works. Now someone types this as their name:

```text
x' OR '1'='1
```

The database receives:

```sql
SELECT balance FROM accounts WHERE owner = 'x' OR '1'='1'
```

The quote in the input closed the string early, and the rest became SQL.
`'1'='1'` is always true, so the query returns every account. Some
interfaces also accept several statements in one string, separated by
semicolons (libpq's `PQexec` does), so input like
`x'; DROP TABLE accounts; --` can run a second statement of the
attacker's choosing.

The problem is that the database parses one string, and it has no way to
know which parts you wrote and which parts came from the user.

## Parameters keep them apart

A parameterized query sends the SQL and the values separately:

```go
db.QueryRow("SELECT balance FROM accounts WHERE owner = $1", name)
```

![Two paths to the database. Top, concatenation: the SQL text and the user's input are joined into one string, the SQL parser reads all of it, and the input's quote ends the string so OR '1'='1' runs as code. Bottom, parameters: the SQL text with $1 goes to the parser, while the value travels separately straight to execution, where it is only compared as data, so the payload is just an odd name that matches no rows.](img/sql-injection-parameters.svg)

*Concatenation hands the parser one string. Parameters never let the value near the parser.*

The SQL text is fixed and written by you. The value travels on its own
and is used only as a value. With the input from before, the database
looks for an owner literally named `x' OR '1'='1`, finds none, and
returns nothing. There's no quoting to get right, because nothing gets
quoted.

In Postgres's C library this is `PQexecParams`, which passes parameter
values apart from the command string. It also accepts only one
statement per call, a limit of the protocol that happens to block the
stacked `; DROP TABLE` trick. Prepared statements work the same way.
Nearly every language's database interface supports parameters, and
[[orm|ORMs]] build parameterized queries for you.

## Things that can't be parameters

Parameters stand in for values only. Table names, column names and
`ASC`/`DESC` can't be passed that way, so this is where injection can
creep back into code that's otherwise careful, in sort and filter
features.

For these, don't pass the user's text through. Map it to a fixed choice
in your code:

```go
col := map[string]string{"date": "created_at", "total": "amount"}[req.Sort]
if col == "" { return errBadSort }
dir := "ASC"
if req.Desc { dir = "DESC" }
q := "SELECT * FROM orders ORDER BY " + col + " " + dir
```

Only strings you wrote end up in the query. Converting input to a
non-string type first (a boolean, a number, an enum) has the same
effect. If you truly must use a name from outside, escape it with the
driver's identifier-escaping function, such as libpq's
`PQescapeIdentifier`.

## Where it gets tricky

**Escaping is the fragile fallback.** Escaping every input by hand
is specific to each database, and nobody can promise it catches every
case. Don't escape values you pass as parameters either; it's neither
needed nor correct.

**Validation isn't the fix.** Checking input at the edge
([[validation-at-boundary]]) is useful, but data that passed validation
still isn't safe to paste into SQL. Parameters are the defense;
validation is extra.

**ORMs aren't automatically safe.** Their own query languages can be
injected the same way (Hibernate's HQL is a known case), and any raw
SQL you pass through an ORM is ordinary SQL.

**Stored procedures aren't automatically safe.** They're as good as
parameters only if they don't build dynamic SQL from their arguments
inside.

## What this means when you build

- Use placeholders for every value, every time. Treat any string
  formatting that builds SQL as a bug to justify.
- For names and sort orders, map input to a fixed list in code.
- Give the application's database role only the privileges it needs,
  never an admin role, so a successful injection can do less.

## Further reading

- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), OWASP Cheat Sheet Series. The four defenses in order, allow-listing names and sort orders, and least privilege.
- [Command Execution Functions (libpq)](https://www.postgresql.org/docs/current/libpq-exec.html), PostgreSQL 18 documentation. `PQexec` vs `PQexecParams`, the one-statement limit, and when escaping is and isn't right.
