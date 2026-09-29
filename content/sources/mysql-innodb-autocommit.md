---
id: mysql-innodb-autocommit
title: "MySQL 8.4 Reference Manual, 17.7.2.2 autocommit, Commit, and Rollback"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-autocommit-commit-rollback.html
kind: docs
primary: true
---

## Summary

How InnoDB (MySQL 8.4) wraps every statement in a transaction, what the
autocommit setting changes, and what COMMIT and ROLLBACK do.

## Key claims

- Every statement in InnoDB runs inside a transaction. "In InnoDB, all user activity occurs inside a transaction." (first paragraph)
- Autocommit is on by default, so each successful statement commits by itself. "By default, MySQL starts the session for each new connection with autocommit enabled, so MySQL does a commit after each SQL statement if that statement did not return an error." (first paragraph)
- With autocommit off, a transaction is always open. "If autocommit mode is disabled within a session with SET autocommit = 0, the session always has a transaction open." (third paragraph)
- If such a session ends without COMMIT, its last transaction is rolled back. "If a session that has autocommit disabled ends without explicitly committing the final transaction, MySQL rolls back that transaction." (third paragraph)
- Some statements commit the open transaction implicitly. "Some statements implicitly end a transaction, as if you had done a COMMIT before executing the statement." (fourth paragraph)
- COMMIT makes changes permanent and visible; ROLLBACK cancels them. "A ROLLBACK statement, on the other hand, cancels all modifications made by the current transaction." (fifth paragraph)

## Visuals worth redrawing

None.

## My notes

- The list of statements that commit implicitly (mostly DDL) is on a
  separate page, 15.3.3, not opened.
- curl with a default user agent got an error page; opened with browser
  headers.
