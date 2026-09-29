---
id: bola
title: Broken object-level authorization
depth: short
phase: 15
note: >-
  Broken object-level authorization: changing an ID in the URL to read
  someone else's data.
needs: [authorization-models, owasp-api-top-10]
leads_to: []
compare_with: [multi-tenancy]
---

# Broken object-level authorization

Broken object-level authorization (BOLA) is when an API takes an object
ID from the request and acts on that object without checking that the
caller is allowed to. Change `/invoices/1041` to `/invoices/1042` and
you're reading someone else's invoice. It's first on the
[[owasp-api-top-10|OWASP API Top 10]], rated easy to exploit and
widespread. The same bug is also called insecure direct object
reference (IDOR).

## One changed number

Alice is logged in to an invoicing API. Her app loads her invoice:

```http
GET /invoices/1041
Cookie: session=alice…
```

The handler checks the session, then runs:

```sql
SELECT * FROM invoices WHERE id = $1   -- $1 = 1041
```

Alice changes the number to 1042 and sends it again. The session is
still valid, so authentication passes. The query finds invoice 1042,
which belongs to Bob, and the API returns it.

![Two requests from Alice's valid session. GET /invoices/1041 and GET /invoices/1042. With a lookup by ID alone, both return an invoice, and the second one is Bob's. With a lookup scoped to Alice, WHERE id = $1 AND owner_id = alice, the second request finds nothing and gets 404.](img/bola-scoped-lookup.svg)

*The only difference is the lookup. Scoped to the caller, Bob's invoice doesn't exist for Alice.*

Nothing about the request was unusual. Alice is allowed to call
`GET /invoices/{id}`; she just isn't allowed to call it on that object.
That's the difference from broken *function*-level authorization, where
the caller shouldn't reach the endpoint at all (an ordinary user calling
an admin route).

It's common in APIs because the server leans on IDs the client sends to
decide what to load. The ID can be anything: a sequential integer, a
UUID, a file name, an account number. And it can sit anywhere: the
path, the query string, a header, a hidden form field, a JSON body, a
GraphQL variable.

## The fix: scope every lookup

Every handler that takes an object ID and does anything with the
object needs a check that this caller may do this action on this
object. The simplest way to get it right is to never look an object up
by ID alone. Look it up inside the set the caller can access:

```sql
SELECT * FROM invoices WHERE id = $1 AND owner_id = $2  -- $2 from the session
```

In an [[orm|ORM]] that's the difference between
`Invoice.find(id)` and `current_user.invoices.find(id)`. Either way,
Bob's invoice simply isn't found. Take the caller's identity from the
session or token, never from a parameter the client sent.

Ownership is the easy case. When access depends on sharing, teams or
roles, the check has to go through your authorization logic rather than
a single column; [[authorization-models]] covers the options, and
[[row-level-security]] can enforce a rule inside the database as a
backstop.

The check applies to every operation that takes a reference: read,
create, update, delete, export and admin actions. A delete mutation in
GraphQL that removes whatever document ID it's given is the same bug.

## Where it gets tricky

**Comparing IDs isn't the check.** Pulling the user ID out of the
session and comparing it with a user ID in the URL fixes only the
endpoints whose object is a user. For invoices, documents or orders,
you need to know who owns or may see each object.

**Random IDs don't fix it.** Advice differs on how much unguessable IDs
help. Some guidance lists random IDs as a prevention step; other
guidance calls them defense in depth only, since the check is still
required. The UUID spec itself says UUIDs must not be used as security
capabilities, identifiers whose possession grants access. IDs leak into
URLs people share, logs, and other endpoints that list them. In one
published example, an attacker got every shop's name from one endpoint
and then read each shop's revenue from another. If you do use UUIDs as
IDs, prefer random version 4 over time-ordered version 7 anywhere
security matters, because v7 reveals when the object was made.

**Don't encrypt IDs instead.** Encrypting identifiers is hard to do
securely and still isn't a permission check.

**Every new endpoint is a new chance.** The bug comes back whenever
someone adds a handler and forgets the check. That's why it pays to make
the scoped lookup the only way your code can load an object.

## What this means when you build

- Load objects through functions that take the caller as an argument,
  so an unscoped lookup is hard to write.
- Test with two users: create objects as user A, then try to read,
  change and delete them as user B. Do it for every route that takes an
  ID, and fail the build when one succeeds.
- Use random IDs if you like, as an extra layer. Don't count them as the
  check.

## Further reading

- [API1:2023 Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/), OWASP API Security Project, 2023. Why APIs are prone to it, BOLA vs BFLA, three real-world style examples.
- [Insecure Direct Object Reference Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html), OWASP Cheat Sheet Series. The scoped-lookup fix, testing with two users, and where random IDs fit.
- [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562), K. Davis, B. Peabody, P. Leach, IETF, 2024. Section 8: UUIDs are not security capabilities, and v4 over v7 where security is involved.
