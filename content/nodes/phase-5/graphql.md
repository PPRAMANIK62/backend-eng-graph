---
id: graphql
title: GraphQL
depth: deep
phase: 5
note: >-
  The client picks the fields. Resolvers, the N+1 problem, and what it
  costs caching and rate limiting.
needs: [api-design]
leads_to: []
compare_with: [rest, n-plus-one, rate-limiting, api-versioning]
---

# GraphQL

GraphQL is a query language for APIs and a runtime that executes it.
The client sends one document listing exactly the fields it wants, and
the server answers with JSON in the same shape. That moves the question
"what data does this screen need?" from the server to the client, and
in exchange hands the server three hard problems: N+1 queries, caching,
and clients that can ask for far too much.

## One request, shaped like the answer

GraphQL was created in 2012, and work on it as an open standard began
in 2015. The current spec is the 2025 edition. Its first example asks
for one user's name:

```graphql
{ user(id: 4) { name } }
```

and gets back:

```json
{ "user": { "name": "Mark Zuckerberg" } }
```

Grow the query and the response grows with it, field for field. Ask
for `name` and `posts(first: 2) { title }`, and you get the name and two
titles, nothing else. In most APIs built without GraphQL, the server
decides what each endpoint returns. Here the client decides, at the
level of single fields, and the response contains what it asked for and
no more.

A request is a document that can hold three kinds of operations:
**queries** read, **mutations** change things, and **subscriptions**
stream results over time. All of them usually go to a single URL.

## The schema is the contract

Every GraphQL service publishes a schema: its types, their fields, and
the arguments each field takes. That's the equivalent of the resource
list in [[api-design]], written in GraphQL's own type language. Three
things follow from it:

- **Queries are checked before they run.** Tools can validate a query
  against the schema at development time, and the server rejects an
  invalid one before executing anything.
- **The schema describes itself.** Clients can query it through
  GraphQL itself (introspection), and developer tools and client
  libraries are built on that.
- **Errors are part of the result.** A response has a `data` entry
  and, if anything went wrong, an `errors` list. A field that fails
  becomes `null`, and the rest of the data still comes back. If the
  field was declared non-null, the error moves up to its parent
  instead, so a parent object can come back `null` because one child
  failed. If the request was invalid before execution started, there's
  no `data` at all.

Fields can also be marked deprecated in the schema.

## Execution: one resolver per field

The server executes a query by walking it like a tree. For every field
it calls a **resolver**, a function that takes the parent object and
the field's arguments and returns the value. If the value is an object,
the walk continues into the fields selected under it. Resolvers usually
read a database or call another service, so in practice they're
asynchronous.

Order matters only for mutations. Every field except a top-level
mutation field must be free of side effects, so the executor may
resolve fields in any order, even in parallel. The top-level fields of a
mutation run one after another, in the order they're written, so two
changes in one request can't race each other.

## The N+1 problem is built in

Resolver-per-field makes server code tidy: each field has one small
function that does one thing. It also makes the naive version chatty.
Take a list of posts with their authors:

![At the top, the query { posts(first: 3) { title author { name } } } and the resolvers it runs: posts, then post 1, 2 and 3, each calling author with ids 7, 9 and 7. Bottom left, without batching: four database queries, one for the posts and one per author field (user 7, user 9, user 7 again), highlighted as extra work. Bottom right, with a DataLoader: two queries, one for the posts and one for users where id is in 7 and 9, because loads made in the same tick are collected into one batch and author 7 is loaded once per request.](img/graphql-n-plus-one.svg)

*One list field turns into one query for the list plus one per item, unless the loads are batched.*

The `posts` resolver runs one query. Then each post's `author` resolver
runs its own query, so three posts cost four queries, and a page of 100
costs 101. That's the [[n-plus-one|N+1 problem]], and in GraphQL it's
the default, not a mistake someone made in one handler.

The usual fix is batching, and the reference implementation is
DataLoader, which grew out of the loading layer under Facebook's GraphQL server. Each
resolver still asks for one author with `load(7)`. DataLoader doesn't
query right away. It collects every `load` call made in the same tick
of the [[event-loop|event loop]], then calls one batch function with
all the keys, `[7, 9]`. The batch function must return one value per
key, in the same order. The loader also remembers what it already
loaded, so asking for author 7 twice fetches it once.

That memory is per request, on purpose. DataLoader is not a shared
cache like Redis. If one loader served requests from different users,
one user's data could show up in another's response, so you create a
fresh set of loaders for every request.

## Over HTTP: one endpoint, mostly POST

The GraphQL spec doesn't pick a transport. A separate spec, GraphQL
over HTTP, still a working draft when this was written, fills that
in:

- A client sends a `POST` with a JSON body holding the `query` text,
  an optional `operationName`, the `variables` and `extensions`.
- A server may also accept `GET` with those as URL parameters, but
  only for queries. A mutation over `GET` gets `405 Method Not
  Allowed`, because `GET` has to stay safe (see
  [[http-semantics]]).
- A query that fails validation gets `422` and isn't executed.
- A query that runs gets `200`, even if some fields raised errors,
  because the errors are in the body. With the
  `application/graphql-response+json` media type, clients are told to
  read the body and ignore the status code.
- For a response with both data and errors, the draft recommends
  a new code, `294 Partial Success`. It isn't registered with IANA, so
  any client that doesn't know it treats it as `200`. It exists so
  proxies and monitoring can tell a partial failure from a success.

## Why caching gets harder

HTTP caching keys on the URL (see [[http-caching]]). In a
resource-based API every object has its own URL, so browsers, proxies
and [[cdn|CDNs]] can cache `GET /users/4` without knowing anything
about your app. GraphQL has one endpoint, and most requests are `POST`s
with the query in the body. There's nothing for an HTTP cache to key
on.

There are two ways back:

- **`GET` plus persisted queries.** Send queries as `GET` so HTTP
  caches and CDNs can store them. Long queries don't fit in a URL, so
  the client sends a hash of a query the server already knows, and the
  server looks up the full text.
- **Client-side caches keyed by object.** With no URL per object, the
  client needs another global key. The common answer is an `id` field
  that's unique across every type, often built from the type name plus
  the database id and made opaque with base64. The client can also
  build one itself from `__typename` and a type-specific id.

graphql.org argues that GraphQL is as cacheable as any API with
parameterized requests. That's true once you've set up `GET` and
persisted queries. It isn't true of a default setup that `POST`s
everything.

## A client can write an expensive query

When the client picks the fields, the client picks the cost. A
three-level query can fan out to thousands of rows, and a limit on
requests per minute can't tell a cheap query from a huge one. The
standard defenses are to paginate every list field, cap how deep and
wide a query can be, and estimate each query's cost before running it.

GitHub's public GraphQL API shows what that looks like when this was
written:

- Every connection (list) must say `first` or `last`, between 1 and
  100. That's [[pagination]] enforced by the schema.
- One call can't request more than 500,000 nodes.
- Each query costs points: add up the requests each connection could
  need, assuming full pages, divide by 100 and round. A query for 100
  repositories, 50 issues in each, and 60 labels on each issue needs
  5,101 requests, so it costs 51 points.
- A user gets 5,000 points an hour. The REST API has its own separate
  limit.
- A request that takes more than 10 seconds is stopped.

That's [[rate-limiting]] by cost instead of by request count.

## Where it gets tricky

**"Versionless" has limits.** Adding a field doesn't change anything
for existing clients, because they only receive the fields they ask
for. So a GraphQL API can often add new fields and deprecate old ones
instead of cutting a new version. But removing a field still breaks every client that
asks for it, so the rules of [[api-versioning]] still apply to
removals.

**Status codes stop meaning much.** A response with errors can still be
a `200`. Tools that count `5xx` responses to measure errors see a
healthy service. The `294` proposal is meant to fix that, but it's in
a draft and not a registered code yet, so check what your server
actually sends.

**The caching claim depends on setup.** One side says GraphQL is as
cacheable as anything, the other says caching gets harder. Both are
right about different setups: out of the box it's harder, and making
it easy takes `GET`, persisted queries and global ids.

**Batching is a per-request cache, not a cache.** DataLoader cuts
queries inside one request. It doesn't help the next request, and
sharing it across users is a data leak.

**Only the top level of a mutation is serial.** Two mutation fields run
in order, but the fields selected under each one run in whatever order
the executor likes.

## What this means when you build

- Batch every resolver that loads by key from the first version, with
  a fresh loader per request.
- Paginate every list field, require a page size, and set a cost or
  depth limit before you open the API to clients you don't control.
- Decide early how you'll cache: `GET` with persisted queries for
  shared caching, and globally unique ids for client caches.
- Monitor the `errors` array, not only HTTP status codes.
- Pick GraphQL when many clients need different slices of the same
  data. For a small API with a few fixed uses, a plain [[rest|REST]]
  style API keeps HTTP caching and status codes working for free.

## Further reading

- [GraphQL specification](https://spec.graphql.org/September2025/), GraphQL Foundation, 2025 edition. The language, execution (resolvers, serial mutations, error propagation) and the response format.
- [GraphQL over HTTP](https://graphql.github.io/graphql-over-http/draft/), GraphQL Foundation, working draft. `GET` vs `POST`, the request body, and which status code to send when, including the proposed `294`.
- [Learn GraphQL: Performance](https://graphql.org/learn/performance/), graphql.org. N+1 and batching, `GET` and persisted queries, demand control.
- [Learn GraphQL: Caching](https://graphql.org/learn/caching/), graphql.org. Why client caches need globally unique ids.
- [DataLoader](https://github.com/graphql/dataloader), GraphQL Foundation. How batching within one tick and the per-request cache work.
- [Rate limits and query limits for the GraphQL API](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api), GitHub. A real cost model: points per query, node limits, timeouts.
