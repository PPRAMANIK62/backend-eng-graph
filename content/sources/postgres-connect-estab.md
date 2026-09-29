---
id: postgres-connect-estab
title: "PostgreSQL documentation, 51.2 How Connections Are Established"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/connect-estab.html
kind: docs
primary: true
---

## Summary

A short internals page (read at version 18.6) on the process-per-user
model: the postmaster listens and spawns a backend for each connection.

## Key claims

- Process per user: every client talks to exactly one backend. "PostgreSQL implements a “process per user” client/server model. In this model, every client process connects to exactly one backend process." (51.2)
- The postmaster spawns a new backend per connection request. "Whenever it detects a request for a connection, it spawns a new backend process." (51.2)
- Backends coordinate through semaphores and shared memory. "Those backend processes communicate with each other and with other processes of the instance using semaphores and shared memory to ensure data integrity throughout concurrent data access." (51.2)
- The backend parses, plans and executes each query itself. "The backend process parses the query, creates an execution plan, executes the plan, and returns the retrieved rows to the client by transmitting them over the established connection." (51.2)
- The postmaster listens on a TCP/IP port. "This supervisor process is called postmaster and listens at a specified TCP/IP port for incoming connections." (51.2)

## Visuals worth redrawing

None.

## My notes

None.
