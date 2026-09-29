---
id: cqrs
title: CQRS
depth: short
phase: 10
note: >-
  Separate models for writes and for reads.
needs: [event-sourcing, denormalization]
leads_to: []
compare_with: [search-architecture]
---

# CQRS

CQRS (command query responsibility segregation) means using one model
to change data and a different model to read it. Writes go through a
command side that enforces the rules; reads come from a query side
shaped for the screens and reports that need them. It pairs naturally
with [[event-sourcing]], and it's easy to overuse.

## From one service to two

Take a customer service with the usual mix of methods:

- `MakeCustomerPreferred(id)`, `ChangeCustomerLocale(id, locale)`,
  `CreateCustomer(customer)`, `EditCustomerDetails(details)`
- `GetCustomer(id)`, `GetCustomersWithName(name)`,
  `GetPreferredCustomers()`

The first group changes state and returns nothing. The second returns
data and changes nothing. CQRS splits them into a `CustomerWriteService`
and a `CustomerReadService`, each with its own model.

The idea grew out of Bertrand Meyer's command-query separation, which
says a single method should either change state or return data, never
both. CQRS applies the same split one level up, to whole models, and
for a long time the two were confused.

![Left: one model serves both writes and reads, sitting on one store. Right: commands go to a write model that validates and stores normalized data; changes flow, often as events and a moment later, to a read model with denormalized views that serves queries.](img/cqrs-split.svg)

*One model for both, versus a write model and a read model kept in step. Adapted from Martin Fowler, "CQRS" (2011).*

## Why the two sides want different things

Once they're separate, you notice the two sides have different needs:

- **Consistency.** Processing a command is much easier on consistent,
  current data. Most query screens can live with data a moment old.
- **Storage.** The command side wants normalized data (see
  [[normalization]]) so each fact is stored once. The query side wants denormalized data ([[denormalization]])
  so a screen is one read, no joins.
- **Scale.** In most systems, and web systems especially, reads far
  outnumber writes. Separate models let you scale and tune each side on
  its own.

A single model has to compromise on all three.

## How the read side stays up to date

There's a range here:

- **Same database, different models.** The two sides are separate code
  over one database, and the database is the link between them. Reads
  see writes as soon as they commit.
- **Separate read store.** The query side has its own database, a
  reporting copy kept up to date from the write side. Now you need a
  way to feed it, usually events, and reads become eventually
  consistent.
- **With event sourcing.** The write side stores events, and each read
  model is a projection built from them. The two fit well together and
  are often used as a pair, but CQRS doesn't require it.

## Where it gets tricky

**Most systems don't need it.** Many systems fit a plain
create-read-update-delete model, and CQRS adds real complexity:
two models, a sync mechanism, and eventual consistency where users may
not expect it. Martin Fowler, who wrote up the pattern, found that most
of the projects he saw using it had got into serious difficulty
because of it.

**Use it for part of a system, not all of it.** It can pay off in a
complex part of the domain, or where reads and writes differ hugely in
load. Elsewhere, keep one model.

**You may only need a reporting database.** If the trouble is a few
heavy queries, copy data to a separate reporting database for those and
keep one model for everything else.

## What this means when you build

- Start with one model. Split when the read and write sides are
  clearly pulling the model in different directions.
- Apply it to one area of the system, not across the board.
- If the read side gets its own store, design the screens for lag: a
  user may not see their own change immediately.
- Don't assume CQRS means event sourcing, or the other way around.

## Further reading

- [CQRS](https://martinfowler.com/bliki/CQRS.html), Martin Fowler, 2011. The short definition, the variations, and a strong warning about when not to use it.
- [CQRS Documents](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf), Greg Young, 2010. From the person who named it: the origin in command-query separation, the customer service split, and why the two sides differ.
