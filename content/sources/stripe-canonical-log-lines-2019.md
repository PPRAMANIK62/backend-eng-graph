---
id: stripe-canonical-log-lines-2019
title: "Fast and flexible observability with canonical log lines"
author: Brandur Leach (Stripe)
url: https://stripe.com/blog/canonical-log-lines
kind: blog
primary: true
---

## Summary

Stripe's engineering blog (2019) on canonical log lines: besides its
normal log lines, every request emits one wide line at the end with its
key facts (user, auth, rate limit result, timings, query count, status).
It shows how that turns cross-line log queries into one-line filters,
how Stripe makes sure the line is always written, and how the same
lines, with a stable schema, feed a data warehouse and a product
dashboard.

## Key claims

- The technique: one long line per request at the end. "in addition to their normal log traces, requests also emit one long log line at the end that includes many of their key characteristics." (intro)
- Used in almost every Stripe service. "we’ve put them in almost every service we run" (intro)
- The word structured is ambiguous: JSON, or key=value pairs. "The use of the word structured is ambiguous—it can refer to a natively structured data format like JSON, but it often means that log lines are enhanced by appending key=value pairs (sometimes called logfmt, even if not universally)." (structured logging)
- key=value is a compromise between machine and human readability. "the key=value convention is designed to be a compromise between machine and human readability" (structured logging)
- Metrics dashboards are designed in advance; logs are more flexible. "The emitted metrics and dashboards that interpret them are designed in advance, and in a pinch they’re often difficult to query in creative or unexpected ways." (structured logging)
- Facts spread across lines are slow and awkward to query. "that involves scanning a lot of data, and it’s slower to run." (structured logging)
- The line is the authoritative record for the request. "We call the log line canonical because it’s the authoritative line for a particular request" (canonical log lines)
- Especially useful early in an incident, before you know what's wrong. "This is especially valuable during the discovery phase of an incident where it’s understood that something’s wrong, but it’s still a mystery as to what." (canonical log lines)
- Example query: count rate-limited requests by user. "canonical-log-line rate_allowed=false | stats count by user_id" (canonical log lines)
- Written from a middleware after the request, in an ensure block, and never fails the request. "The logging statement itself is wrapped in its own begin/rescue block so that any problem constructing a canonical line will never fail a request" (implementation)
- Log data is verbose and expensive to keep. "long-term retention in anything but cold storage is expensive" (implementation)
- Field names kept stable and codified in a protocol buffer. "we took it a step further and formalized the contract by codifying it with a protocol buffer." (implementation)
- Also sent asynchronously to Kafka, then S3 and a warehouse. "the API also serializes data according to that contract and sends it out asynchronously to a Kafka topic." (implementation)
- One line per request per service. "A canonical line is one line per request per service that collates each request’s key telemetry." (recap)
- Not as quick as metrics, but more flexible. "Canonical lines are not as quick to reference as metrics, but are extremely flexible and easy to use." (recap)
- Engineers built muscle memory around field names, so they are kept stable. "we’ve developed muscle memory around the naming of particular fields." (implementation)
- Their succinctness makes canonical lines good for archiving. "the succinctness of canonical log lines also make them a convenient medium for archiving historical requests." (implementation)
- Logged in an ensure block in case of exceptions. "The line is logged in a Ruby ensure block just in case the middleware stack is being unwound because an exception was thrown from somewhere below." (implementation)
- Spread-out facts need slow searches and intricate syntax. "searching for the right details can be slow and requires intricate query syntax." (intro)
- The example request fields: auth_type, user_id, rate_allowed, database_queries, duration, http_status. "Request finished alloc_count=9123 database_queries=34 duration=0.009 http_status=200" (structured logging, example log lines)
- Lines go to a warehouse for long-term analytics. "A group of consumers cooperatively reads the stream and bulk inserts its contents into a warehouse" (Emitting to a data warehouse)

## Visuals worth redrawing

- The same request logged as five plain lines, then five key=value
  lines, then one canonical line.

## My notes

- Brandur also posts the same article on his own site; the Stripe post
  is the one cited.
