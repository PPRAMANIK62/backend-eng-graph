---
id: api-design
title: API design
depth: deep
phase: 5
note: >-
  Resource-oriented design: resources, standard and custom methods,
  consistent names. An API is a promise you can't easily take back.
needs: [http-semantics]
leads_to: [graphql, pagination, api-versioning, validation-at-boundary, long-running-operations, backwards-compatibility]
compare_with: [rest]
---

# API design

An API is the set of requests other programs can send to yours, and
what they get back. Designing one means picking its nouns, its verbs
and its names before anyone depends on them. Once code in production
calls your API, every change can break that code, so the choices you
make on day one are the ones you live with.

## Start with nouns, not verbs

Say you're building the API for a service that tracks publishers and
their books. A first draft usually lists what the app needs to do:
`getBooksByAuthor`, `createBookFromDictation`, `archiveBook`,
`getPublisherBooks`. Every new screen adds a function with its own
arguments and its own rules. A year later a client developer has to
read the docs for each one, because nothing about the first function
tells them how the fortieth behaves.

Resource-oriented design flips the order. Google's API guidelines (the
AIPs) and Microsoft's Azure guidelines both build on it. You decide, in
this order:

1. The resources the API offers: the nouns.
2. How they relate and nest.
3. The fields of each resource.
4. The methods on each one, using the standard ones wherever you can.

For the bookshop the nouns are publishers and books, and each publisher
owns a collection of books. The API becomes a tree where every node is
either one resource or a collection of resources of the same type:

![On the left, a resource tree: the publishers collection contains publisher 123, which contains a books collection, which contains the book les-miserables. Its name is publishers/123/books/les-miserables. On the right, the methods as HTTP requests under /v1/publishers/123: List is GET /books, Get is GET /books/les-miserables, Create is POST /books, Update is PATCH /books/les-miserables, Delete is DELETE /books/les-miserables. Below a line, a custom method: Archive is POST /books/les-miserables:archive.](img/api-design-resource-tree.svg)

*One resource tree and the handful of methods on it. The standard methods cover almost everything; Archive is the one custom method. Example names adapted from Google, AIP-122 and AIP-136.*

The guidelines are blunt about one trap: an API that copies your
database schema is an anti-pattern. It welds the public surface to the
storage underneath, so you can't change one without breaking the
other. Model what the client thinks about, not how you store it.

## A few standard methods do most of the work

A resource-oriented API has many resources and few methods on each.
There are five standard methods:

- **List** returns the resources in a collection.
- **Get** returns one resource.
- **Create** adds a resource to a collection.
- **Update** changes some fields of a resource.
- **Delete** removes it.

Every resource needs Get, so that after any change a client can read
back what actually happened. Every resource needs List too, unless
there can only ever be one of it.

Over HTTP these map onto the methods from
[[http-semantics|HTTP semantics]]. List and Get are `GET`, on the
collection and on the resource. Update is `PATCH`, and Microsoft's
guidelines use a JSON Merge Patch body for it. Delete is `DELETE`.
Create is usually a `POST` to the collection, answered with `201
Created` and a `Location` header pointing at the new resource, or a
`PUT` to the new resource's own URL, since `PUT` means "create or
replace the state at this URL".

One rule makes the whole API easier to use: a resource has the same
shape in every method. The book you send to Create, the book Get
returns and the book inside a List page all use one schema. Client
libraries then need one type per resource, and a client can take what
it read, change a field and send it back.

## Custom methods for what doesn't fit

Some actions aren't a create, read, update or delete. Archiving a
book, sorting a collection and translating a piece of text are
examples. Both Google and Microsoft handle these the same way: a
`POST` with the verb after a colon at the end of the path, such as
`.../books/les-miserables:archive` or `.../books:sort`. A custom
method is not a new HTTP method. It's an ordinary `POST` (or `GET`,
if it only reads) with the verb in the URL.

Some rules keep custom methods from multiplying:

- **Prefer the standard methods.** Their meaning is known in advance.
  But don't bend them into something they aren't just to avoid a
  custom method.
- **Name it verb then noun, with no prepositions.** A name like
  `GetBookByAuthor` or `CreateBookFromDictation` usually means a field
  is missing somewhere else. Instead of `GetBookByAuthor`, add a
  `SearchBooks` method with an `author` field. Otherwise you end up
  with a pile of narrow methods that bloat the API and every client
  library.
- **`GET` for reads, `POST` for anything with side effects.** That
  split tells a caller which methods are safe to call without changing
  anything.

## Names are part of the contract

Every resource has a name, and the name is what users store to find it
again. In Google's style a name looks like a URL path without the
leading slash: `publishers/123/books/les-miserables`. The segments
alternate between collection ids (`publishers`, `books`, plural nouns)
and resource ids (`123`, `les-miserables`). The full URL adds a host
and a version, `https://library.googleapis.com/v1/publishers/123/books/les-miserables`,
but the name itself leaves the version out, because the same book
should keep the same name across versions of the API.

When one resource refers to another, it stores the other's name as a
string. It doesn't embed a copy of the other resource. Embedding
causes three problems:

- **Lifecycle.** When the embedded resource is deleted, what happens
  to the copies?
- **Permissions.** A user who may read a book but not its shelf can no
  longer see the whole book.
- **Coupling.** Any change to one resource's schema or permissions
  now ripples into the other.

References also shouldn't form cycles. If A points to B and B points
back to A, creating them takes three calls instead of two, and
deleting them needs a careful order.

## Each request stands on its own

A resource-oriented API is stateless: each request means the same
thing no matter what the client sent before, and any resource can be
reached directly by its name, without a series of calls to "get there"
first. The server keeps the data. The client keeps track of where it
is in its own workflow.

Google adds a consistency rule for methods that manage resources: when
a method returns, the change is done. After a successful create, a get
must return the new resource. After a successful delete, a get must
return not-found. Clients chain calls (create A, then create B that
points at A), and they need "the call returned" to mean "you can build
on it". When the work genuinely can't finish inside one request, the
method should say so and hand back something to poll, which is what
[[long-running-operations]] are for.

## An API is a promise you can't easily take back

Users write code against your API and ship it, expecting it to keep
working. Google's guidelines split "keep working" into three kinds of
[[backwards-compatibility|compatibility]]:

- **Source:** code written against the old version still compiles
  against the new client library.
- **Wire:** an old client can still talk to the new server.
- **Semantic:** an old client still gets what a reasonable developer
  would expect.

Adding things is usually safe: a new resource, a new method, a new
optional field. Almost everything else breaks someone, including
changes that look harmless, like a new default or a higher length
limit. [[backwards-compatibility]] goes through them. The one to design
for from the start is [[pagination]]: adding it later to a List that
used to return everything breaks every client that reads only the first
page.

When you truly have to break something, that's what
[[api-versioning]] is for. How the bytes themselves can change safely
is [[schema-evolution]].

## Where it gets tricky

**This isn't quite REST.** Resource-oriented design borrows heavily
from REST, but the AIPs are written for RPC APIs, defined in
[[protobuf]] for [[grpc]] with an HTTP mapping on top. Both Google and
Microsoft publish fixed URL patterns that clients build themselves.
Whether that deserves the name REST is an old argument, covered in
[[rest]].

**"Compatible" is a judgment call.** It isn't always clear whether a
change is compatible, and code depends on behavior you never
documented. Google's list of breaking changes is a guide, not a
complete rulebook. The usual escape is to be
conservative: if you can imagine a reasonable client breaking, treat
it as breaking.

**Enums.** Adding a value to an enum looks like adding something, which
should be safe. But a client with a `switch` that handles every known
value can crash on a new one. Google allows new values with caution
and asks you to document which enums will grow. Microsoft recommends
"extensible" enums, modeled as strings, unless you're sure the set
will never change.

**Strict or lenient about unknown fields.** Microsoft's guidelines tell
a service to reject a request with `400` if it contains any field the
service's version doesn't understand, so a client sees its mistake
immediately. That's a decision about [[validation-at-boundary]], and
it cuts both ways: it catches typos, and it also rejects a client that
sends a field from a newer version.

**The colon is a convention.** `:archive` isn't HTTP syntax, just a
pattern both companies adopted. Microsoft tells you to disallow `:` in
resource ids so an id can't be mistaken for an action.

## What this means when you build

- List the resources and their hierarchy before writing any handler.
  Don't copy your tables.
- Use the five standard methods first. Add a custom method only for a
  real action, named verb-noun, as a `POST` with `:verb`.
- Give every resource Get and List, and one schema across all methods.
- Paginate every List from the first release.
- Treat every change as a possible break. Add freely, remove never,
  and review changes before they ship.

## Further reading

- [AIP-121: Resource-oriented design](https://google.aip.dev/121), Google. The core rules: resources first, five standard methods, stateless, consistent after completion.
- [AIP-122: Resource names](https://google.aip.dev/122), Google. How names are built, why references use names, and why not to embed resources.
- [AIP-136: Custom methods](https://google.aip.dev/136), Google. The `:verb` pattern, naming rules and why prepositions are banned.
- [AIP-180: Backwards compatibility](https://google.aip.dev/180), Google. Source, wire and semantic compatibility; the full list of breaking changes is in backwards-compatibility.
- [Microsoft Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md), Microsoft. The same ideas as HTTP rules: methods, field mutability, actions, collections.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham, Reschke (eds.), IETF, 2022. What `POST`, `PUT` and `201 Created` mean, which the standard methods map onto.
