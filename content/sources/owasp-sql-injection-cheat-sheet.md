---
id: owasp-sql-injection-cheat-sheet
title: SQL Injection Prevention Cheat Sheet
author: OWASP Cheat Sheet Series
url: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's guide to preventing SQL injection. The cause (building queries
by string concatenation with user input), four defenses in order of
preference (parameterized queries, safe stored procedures, allow-list
validation for parts that can't be parameters, and escaping, strongly
discouraged), and least privilege as defense in depth.

## Key claims

- The cause is dynamic queries built by concatenating user input. "Attackers can use SQL injection on an application if it has dynamic database queries that use string concatenation and user-supplied input." (What Is a SQL Injection Attack?)
- Parameterized queries define the SQL first and pass values later. "parameterized queries force the developer to define all SQL code first and pass in each parameter to the query later." (Defense Option 1)
- The database then always tells code from data. "If database queries use this coding style, the database will always distinguish between code and data, regardless of what user input is supplied." (Defense Option 1)
- The classic payload is matched as a literal string. "if an attacker were to enter the userID as tom' or '1'='1, the parameterized query would look for a username that literally matches the entire string tom' or '1'='1." (Safe Java Prepared Statement Example)
- Query languages in ORMs have the same problem (HQL injection) and support parameters too. "Even SQL abstraction layers, like the Hibernate Query Language (HQL) with the same type of injection problems (called HQL Injection) support parameterized queries as well" (Defense Option 1)
- Stored procedures are as safe only if they don't build dynamic SQL inside. "Though stored procedures are not always safe from SQL injection" (Defense Option 2)
- Table names, column names and sort order can't be bind variables; use allow-lists or redesign. "If you are faced with parts of SQL queries that can't use bind variables, such as table names, column names, or sort order indicators (ASC or DESC), input validation or query redesign is the most appropriate defense." (Defense Option 3)
- Map the user's value to a fixed name in code. "developers should map the parameter values to the legal/expected table or column names to make sure unvalidated user input doesn't end up in the query." (Sample Of Safe Table Name Validation)
- Parameterized interfaces exist almost everywhere. "practically all other languages (including Cold Fusion and Classic ASP) support parameterized query interfaces." (Defense Option 1)
- ORMs that build queries for you are among the recommended routes. "it should be built or re-written using parameterized queries, stored procedures, or some kind of Object Relational Mapper (ORM) that builds your queries for you." (Defense Option 4)
- Escaping is database-specific. "It is very database specific in its implementation." (Defense Option 4)
- Converting input to a non-string type makes it safe to use. "Any time user input can be converted to a non-String, like a date, numeric, boolean, enumerated type, etc. before it is appended to a query, or used to select a value to append to the query, this ensures it is safe to do so." (Sample of Safer Dynamic Query Generation)
- SQL injection is very common. "SQL Injection vulnerabilities are very common." (Introduction)
- Never give the app an admin account. "DO NOT ASSIGN DBA OR ADMIN TYPE ACCESS TO YOUR APPLICATION ACCOUNTS." (Least Privilege)
- Escaping is fragile and not guaranteed. "This methodology is fragile compared to other defenses, and we CANNOT guarantee that this option will prevent all SQL injections in all situations." (Defense Option 4)
- Least privilege limits the damage. "To minimize the potential damage of a successful SQL injection attack, you should minimize the privileges assigned to every database account in your environment." (Least Privilege)
- Validation isn't a substitute for parameters. "Validated data is not necessarily safe to insert into SQL queries via string building." (Allow-list Input Validation)
- Prepared statements and parameterized queries are the same first defense. "Defense Option 1: Prepared Statements (with Parameterized Queries)" (heading)

## Visuals worth redrawing

None.

## My notes

- Doesn't cover drivers that "emulate" prepared statements by
  interpolating on the client. Not found in any opened source, so not
  claimed.
