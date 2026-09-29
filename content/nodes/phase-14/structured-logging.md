---
id: structured-logging
title: Structured logging
depth: short
phase: 14
note: >-
  Logs as fields a machine can query, not sentences.
needs: [observability]
leads_to: [audit-logging, distributed-tracing]
compare_with: []
---

# Structured logging

Structured logging means writing each log entry as named fields, such
as `status=500 route=/v1/charges user_id=usr_123`, instead of a
sentence with the values mixed into the words. A machine can then
filter, count and group log entries by any field, which turns logs from
something you scroll through into something you query. Logs are one of
the three kinds of telemetry in [[observability]], and this is what
makes them useful at scale.

## From a sentence to fields

Here's one request logged the old way:

```
Charge created for user usr_123
```

A person can read that. A log system can only search it as text: to
count charges per user you'd need a regular expression that knows the
exact wording, and it breaks the day someone edits the message.

The structured version keeps the message short and fixed, and puts the
values in fields:

```
msg="charge created" charge_id=ch_123 user_id=usr_123
```

That's `key=value` style, sometimes called logfmt. It's a compromise:
still readable in a terminal, and easy for a machine to split. The
other common format is one JSON object per entry. "Structured" can mean
either.

In Go, the standard library has done this since Go 1.21, in the
`log/slog` package. The same call can print either format, depending on
which handler you plug in:

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
logger.Info("charge created", "charge_id", "ch_123", "user_id", "usr_123")
```

With the JSON handler, each call prints one JSON object with `time`,
`level`, `msg` and your fields. Swap in the text handler and you get
`key=value` pairs instead. The code that logs doesn't change.

## What it buys you

Once every entry has fields, questions you didn't plan for become
queries: all requests with status 500 in the last hour, grouped by
route; which users got rate limited most. A metrics dashboard can only
show what someone chose to measure in advance (see [[metrics]]). A log
store with fields can answer the question you only thought of during
the incident.

Fields also let you keep values metrics can't afford, like a user id
or a request id (why metrics can't is [[cardinality]]).

## One wide line per request

Structured fields spread across many lines still have a problem. If
"user authenticated" is on one line and "rate limit denied" is on
another, answering "which users were rate limited?" means joining lines
by request id at query time. That scans a lot of data and needs
intricate query syntax.

Stripe's fix is the canonical log line: besides the normal lines, each
request writes one extra line at the end, with every key fact about it
in one place. User and how they authenticated, whether the rate limiter
allowed it, total duration, number of database queries, status. Then the rate limit question is a single filter and a count.
Stripe emits one per request per service, in almost every service.

Two details make it work. A middleware writes the line after the
request finishes, from an `ensure` block so it's written even when the
request throws, and any error building the line is caught so logging
can never fail a request. And the field names are kept stable, because
people build muscle memory and queries around them; Stripe eventually
fixed them in a protocol buffer schema and also ships the lines to a
[[data-warehouse|data warehouse]] for long-term analysis.

## Fields worth having on every line

- **A request id and a trace id.** With them, a log line leads to
  everything else about the same request. In slog, you can pass a
  `context.Context` to the logging call so a handler can pull out the
  trace id itself (see [[distributed-tracing]]).
- **Common fields attached once.** `logger.With("service", "billing")`
  returns a logger that adds those fields to every entry. slog can also
  format them once, not on every call.
- **A level.** In slog, levels are just integers, with Debug, Info,
  Warn and Error named.

## Where it gets tricky

**Loose key-value syntax is easy to get wrong.** slog's
`"key", value, "key", value` style is short but lets you drop a key or
a value by mistake. Go's `vet` has a check for it, or you can use typed
attributes like `slog.String("user_id", id)`.

**Logs are expensive to keep.** They're verbose, and keeping them
anywhere but cold storage for long costs real money. That's one reason
canonical lines help: one dense line per request is cheaper to keep
than a scattered dozen.

**Logging on a hot path costs allocations.** slog's designers got
their biggest speed-ups from careful attention to memory allocation.
For hot paths there's `LogAttrs` with typed attributes, and a handler's
`Enabled` check lets unwanted events be dropped before any work is
done.

**Fields can leak secrets.** Once you log whole structs, you log
whatever is in them. slog lets a type define how it's logged, which
you can use to redact passwords and tokens. A log of who did what that
must hold up later is a different thing again: [[audit-logging]].

## What this means when you build

- Log with a structured logger from the first line of code. Short
  fixed messages, values in fields.
- Emit one wide line per request per service at the end, written even
  on errors.
- Put the request id and trace id on every line.
- Keep field names stable, and redact secrets at the type level.

## Further reading

- [Structured Logging with slog](https://go.dev/blog/slog), Jonathan Amsterdam, Go blog, 2023. What structured logs are, and how Go 1.21's `log/slog` does them: handlers, attributes, context, performance.
- [Fast and flexible observability with canonical log lines](https://stripe.com/blog/canonical-log-lines), Brandur Leach, Stripe, 2019. Why facts spread across log lines are hard to query, and the one-wide-line-per-request pattern.
