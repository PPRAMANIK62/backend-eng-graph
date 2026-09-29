---
id: postgres-libpq-exec
title: "PostgreSQL 18 documentation: 32.3. Command Execution Functions (libpq)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/libpq-exec.html
kind: docs
primary: true
---

## Summary

The libpq chapter on running commands, from the PostgreSQL 18 manual
(current when opened). PQexec takes one string; PQexecParams sends the
parameter values separately from the SQL text. Also the escaping
functions and when not to use them.

## Key claims

- PQexecParams passes parameters apart from the command text. "Submits a command to the server and waits for the result, with the ability to pass parameters separately from the SQL command text." (32.3.1, PQexecParams)
- The point is to skip quoting and escaping. "The primary advantage of PQexecParams over PQexec is that parameter values can be separated from the command string, thus avoiding the need for tedious and error-prone quoting and escaping." (32.3.1)
- PQexec accepts several statements separated by semicolons. "The command string can include multiple SQL commands (separated by semicolons)." (32.3.1, PQexec)
- PQexecParams allows only one statement, which also helps against injection. "This is a limitation of the underlying protocol, but has some usefulness as an extra defense against SQL-injection attacks." (32.3.1)
- Escaping untrusted strings matters when you do build SQL text. "Otherwise there is a security risk: you are vulnerable to “SQL injection” attacks wherein unwanted SQL commands are fed to your database." (32.3.4, PQescapeLiteral)
- Don't escape values you pass as parameters. "Note that it is neither necessary nor correct to do escaping when a data value is passed as a separate parameter in PQexecParams or its sibling routines." (32.3.4)
- Identifiers from untrusted input need their own escaping function. "As with string literals, to prevent SQL injection attacks, SQL identifiers must be escaped when they are received from an untrustworthy source." (32.3.4, PQescapeIdentifier)

## Visuals worth redrawing

None.

## My notes

- Parameters travel in the extended query protocol's Bind message; that
  page (protocol-flow) wasn't opened, so the article doesn't name the
  messages.
