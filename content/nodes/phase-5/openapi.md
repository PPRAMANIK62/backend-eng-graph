---
id: openapi
title: OpenAPI
depth: short
phase: 5
note: >-
  Machine-readable API contracts, and generating clients and servers
  from them.
needs: [rest]
leads_to: []
compare_with: [protobuf, webhooks]
---

# OpenAPI

OpenAPI is a standard format for describing an HTTP API in a JSON or
YAML document: its paths, operations, parameters, request and response
bodies, and their schemas. Because a program can read it, one
description can produce documentation, client libraries in many
languages, server stubs and tests. It turns the contract of a
[[rest|REST-style]] API into a file you can review, diff and check.

## A description in one file

Here's one operation from the bookshop API in [[api-design]], getting a
book:

```yaml
openapi: 3.2.0
info:
  title: Library API
  version: 1.4.0
paths:
  /publishers/{publisherId}/books/{bookId}:
    get:
      operationId: getBook
      parameters:
        - { name: publisherId, in: path, required: true, schema: { type: string } }
        - { name: bookId, in: path, required: true, schema: { type: string } }
      responses:
        "200":
          description: The book
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Book" }
components:
  schemas:
    Book:
      type: object
      required: [name, title]
      properties:
        name: { type: string }
        title: { type: string }
```

Read from the top:

- **`openapi`** is the version of the OpenAPI spec the file follows.
  **`info.version`** is the version of your API. The two are
  unrelated.
- **`paths`** holds each URL template and the operations on it. The
  parts in `{}` are path parameters. They're always required, and a
  value can't contain a `/`, so `{bookId}` never matches `a/b`.
- **`in`** says where a parameter lives: path, query, header or cookie
  (3.2 adds a whole-query-string option).
- **`operationId`** must be unique across the whole API. Tools may use
  it to identify the operation, which is why the spec recommends
  names that follow programming conventions, like `getBook`.
- **`responses`** maps HTTP status codes to what comes back.
- **`components`** holds reusable pieces, such as the `Book` schema,
  pulled in with `$ref`. They do nothing until something refers to
  them.

Schemas are a superset of JSON Schema, so the rules for fields
(types, required fields, formats) use a standard vocabulary. A large
API can split its description over several files that refer to each
other; the spec recommends naming the entry file `openapi.yaml` or
`openapi.json`. The description can also list the [[webhooks]] your
API will call on its users.

## One description, many tools

![A file named openapi.yaml, describing paths and operations, parameters and bodies, schemas and security and webhooks, feeds four kinds of output: documentation pages a person can read, client libraries one per language, server stubs with handlers left to fill in, and testing tools and many other uses.](img/openapi-one-description.svg)

*The same description feeds every tool around the API. The uses are the ones listed in the OpenAPI Specification v3.2.1, section 2.*

OpenAPI Generator, an open-source generator, turns a description into client libraries, server stubs (for Go, it can target
`net/http`, Gin or Echo, among many other languages), documentation
and config files. It isn't part of the OpenAPI Initiative, which
publishes the spec; the tooling is a separate ecosystem. It also warns
that a description from an untrusted source is code-generator input,
and a malicious one can inject code into what you generate.

## Where it gets tricky

**Versions and tools move at different speeds.** The spec is at 3.2
(3.2.1 is a patch release), and 3.2 added operations for the new HTTP
`QUERY` method. OpenAPI Generator lists support for 2.0 and 3.0
descriptions, so check what your tools actually handle before
using newer features. The spec also warns that minor versions can
occasionally include small breaking changes.

**The name changed.** Versions up to 2.0 were the Swagger
Specification; Swagger 2.0 was donated to the OpenAPI Initiative, and
3.0 was the first release under the OpenAPI name. You'll still meet
the old name: OpenAPI Generator's README has a guide for migrating from
Swagger Codegen.

**It describes; it doesn't enforce.** A description is a claim about
the server. Nothing in the format makes the running server match it,
so keep them tied together, by generating one from the other or by
testing one against the other.

**Not only JSON.** The description itself is JSON (or YAML), but the
API it describes can send any media type.

## What this means when you build

- Keep the description in the repository next to the code, and review
  its diff like code. A removed field or a new required parameter in
  that diff is a breaking change (see [[api-versioning]]).
- Generate clients from it rather than writing them by hand.
- Pin the OpenAPI version to what your tools support.
- Compared with [[protobuf]] `.proto` files, which are the contract for
  [[grpc]], OpenAPI plays the same role for plain HTTP APIs.

## Further reading

- [OpenAPI Specification v3.2.1](https://spec.openapis.org/oas/v3.2.1.html), OpenAPI Initiative. The format itself: paths, parameters, schemas, components, versions and history.
- [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator), OpenAPI Tools community. What gets generated from a description, for which languages, and the security warning.
