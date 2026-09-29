---
id: backwards-compatibility
title: Backwards compatibility
depth: short
phase: 5
note: >-
  What counts as a breaking change to an API, and how to add things
  without breaking the clients you have.
needs: [api-design]
leads_to: [api-versioning]
compare_with: [schema-evolution]
---

# Backwards compatibility

A change to an API is backwards compatible if code written against the
old version keeps working against the new one, with no changes on the
client side. It's the promise at the heart of [[api-design]]: you ship
the server whenever you like, and clients update whenever they like,
or never. The hard part is that "keeps working" covers far more than
the fields you documented.

## One field, three ways to break it

Say your orders API returns `{"id": "o_1", "total": 1250}` and you
decide `total` should be called `amount`. Look at what that change
can break:

- **Wire compatibility.** An old client can still talk to the new
  server: its requests are accepted, and it can parse the responses.
  Renaming `total` breaks this. The client asks for a field that's no
  longer there.
- **Source compatibility.** Code written against the old client library
  still compiles and runs against the new one. The rename breaks this
  too, because the generated `order.total` accessor disappears.
- **Semantic compatibility.** An old client still gets what a
  reasonable developer would expect. Suppose you kept `total` but
  started returning it in dollars instead of cents. Everything parses
  and compiles, and every invoice is now wrong.

## Adding is usually safe, with conditions

New endpoints, resources and response fields, and new optional
request fields, can generally be added without a new version. Old
clients don't know about them. The conditions are where the mistakes
happen:

- **A new request field must default to the old behavior.** If a
  client doesn't send it, the server must do exactly what it did
  before the field existed.
- **Never a new required field.** Every old client omits it, so every
  old request would start failing.
- **Keep filling what you used to fill.** A field the server
  populated before must stay populated, even if a newer field now
  says the same thing.
- **Be careful with new enum values.** In an enum that only appears in
  requests, adding values is harmless. In a response, a client with a
  `switch` over every value it knows can crash on a new one. If an
  enum will grow, say so in the docs from the start.

## Almost everything else breaks someone

- **Removing or renaming** anything. A rename is a removal plus an
  addition.
- **Changing a field's type**, even to one that encodes the same on
  the wire, because generated client code changes.
- **Changing a default.** Clients that relied on it silently get
  different results.
- **Changing a format**, like an IP address field that starts holding
  IPv6.
- **Tightening validation.** A request that used to succeed now fails.
- **Loosening documented limits** also counts: raise a name's maximum
  length, and clients storing names in columns sized to the old limit
  break.
- **Adding [[pagination]] to a list that used to return everything.**
  Old clients read the first page and think they have it all.

## Changing things without breaking them

Since you can't rename in place, you add the new name next to the old
one. Return both `total` and `amount`. Accept both in requests, and
document what happens when a client sends both with different values.
New clients move to `amount`; old ones keep working.

Then you tell people the old one is going away. HTTP has a standard
for that since RFC 9745 (2025): responses from a deprecated resource
carry a `Deprecation` header with the date it was (or will be)
deprecated, and a `Link` with `rel="deprecation"` pointing to a
migration guide. A `Sunset` header (RFC 8594) adds when it's expected
to stop responding, which can't be earlier than the deprecation.
Deprecating changes nothing about behavior. It's a warning clients can
log and alert on, while you watch traffic to the old field fade.

![A four-step timeline for replacing a field. Step 1: add amount next to total and return both. Step 2: mark total deprecated, with Deprecation and Link headers pointing to a migration guide. Step 3: announce a Sunset date and watch old clients move off. Step 4: remove total, but only in a new major API version. Steps 1 to 3 are compatible changes; step 4 is the breaking one.](img/backwards-compatibility-replace-field.svg)

*Replacing a field: every step but the last is backwards compatible.*

The removal itself still breaks clients, so it waits for a new
version the client opts into; see [[api-versioning]].

## Where it gets tricky

**Clients depend on things you never promised.** How fast a call
returns, for one: no contract mentions it, and clients come to rely on
it anyway. With enough users, someone depends on every behavior they
can observe. This is Hyrum's law, named after Hyrum
Wright, a Google engineer at the time. Tests can tell you a behavior
is depended on; they can't make the dependency go away. So "backwards
compatible" in practice means "compatible with what clients actually
do", and you often find out after you ship.

**It's a judgment call.** No list of breaking changes is complete, and
a strict enough reading would forbid any change at all. The workable
rule is to treat a change as breaking if you can picture a reasonable
client breaking.

**Who the clients are changes the rules.** An API called only by
your own team, or by clients you can force to update, can afford
looser rules than a public one.

**Not the same as schema evolution.** This is about what an API
promises its callers. [[schema-evolution]] is about whether old and new
code can parse each other's bytes, in both directions. A change can
pass one and fail the other.

## What this means when you build

- If an existing client could notice a change, treat it as breaking.
- Make every new input optional, defaulting to the old behavior.
- Never remove or rename in place: add, deprecate with a
  `Deprecation` header and a guide, remove only in a new version.
- Document which enums will grow.
- Log who still uses deprecated fields, so removal follows traffic.

## Further reading

- [AIP-180: Backwards compatibility](https://google.aip.dev/180), Google. Source, wire and semantic compatibility, and the most complete list of what counts as breaking.
- [RFC 9745: The Deprecation HTTP Response Header Field](https://www.rfc-editor.org/rfc/rfc9745), Sanjay Dalal and Erik Wilde, IETF, 2025. The `Deprecation` header, the deprecation link and how they pair with `Sunset`.
- [Hyrum's Law](https://www.hyrumslaw.com/), Hyrum Wright. Why every observable behavior ends up in the contract.
