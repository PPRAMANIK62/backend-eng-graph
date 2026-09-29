---
id: api-versioning
title: API versioning
depth: short
phase: 5
note: >-
  URL, header or never: ways to change an API without breaking clients,
  and what counts as breaking (Hyrum's law).
needs: [api-design, schema-evolution, backwards-compatibility]
leads_to: []
compare_with: [graphql, zero-downtime-migrations]
---

# API versioning

Sooner or later you'll want to change your API in a way that breaks
code already calling it. Versioning lets you ship the change while old
clients keep getting the old behavior. The hard parts are knowing what
counts as [[backwards-compatibility|breaking]], and deciding where the version lives: in the URL,
in a header, or nowhere at all.

## What counts as breaking is more than you think

Stripe's example: bank accounts once had a boolean field `verified`.
Stripe replaced it with a `status` field that can hold the value
`verified`. Any code that read `bank_account[:verified]` broke, because
the field it read no longer existed. Adding a new endpoint, or a new
field that was never there before, is safe. Removing a field, renaming
it or changing its type isn't. The longer list of subtle cases
(defaults, formats, length limits, enums) is in
[[api-design|API design]].

Then there's everything you never promised. Hyrum's law, named after
Hyrum Wright, who noticed it as an engineer at Google: with enough users, it doesn't
matter what the contract says, because every observable behavior of
your system will be depended on by somebody. Even speed, which no
contract promised, becomes something clients count on. Given enough
users the implementation becomes the
interface, and tests can detect these hidden dependencies but not
remove them. So "breaking" really means "breaks someone", and you often
find out only after you ship.

## Three places to put the version

**In the URL path.** `/v1/widgets`, then `/v2/widgets` (or a major
version in the `Accept` header). The problem is size: the changes
between major versions tend to be so big that moving to the next one is
almost as much work as integrating from scratch. Some users never move, and the provider
has to choose between cutting them off and running v1 forever.

**In a query parameter.** Microsoft's Azure guidelines require an
`api-version` parameter on every request, with a date as its value
(plus `-preview` for previews), and forbid a version in the path. A
request without one gets a `400`. Old previews can be retired after at
least 90 days' notice.

**In a header, with a default pinned per account.** This is Stripe's
scheme. Versions are named by release date, and each carries a small
set of breaking changes, so every upgrade is small. On an account's
first request it's pinned to the newest version, and every later call
uses that version unless a `Stripe-Version` header overrides it.
Nobody gets a breaking change by accident, and a new integration needs
less setup.

![A response is built at the current version, then passed through change modules, each undoing one change, newest first, until it matches the client's version. The target version is the Stripe-Version header if sent, else the version of the OAuth app acting for the user, else the version the account was pinned to on its first request.](img/api-versioning-stripe-chain.svg)

*Stripe builds every response at the newest version and walks it back. Adapted from Brandur Leach, "APIs as infrastructure: future-proofing Stripe with versioning" (Stripe, 2017).*

The machinery behind it matters as much as the scheme. Stripe's code
only knows the current shape of each response. Every breaking change is
written as a small module that turns the new shape back into the old
one. To answer a request, the server builds the response at the current
version, then applies those modules backwards, newest first, until it
reaches the version the client wants. Old versions stay out of the main
code paths. With this, Stripe shipped almost a hundred breaking changes
in six years (as of 2017) without a `/v2`. Changes with side effects,
not just a different response shape, don't fit in a module, so Stripe
tries to avoid them.

## Where it gets tricky

**"Never break anything" is a real option, and it's expensive.**
Microsoft's guidelines simply say not to introduce breaking changes.
Stripe tries hard to get a design right the first time, with an API
review before anything ships, because every version is code someone
has to maintain.

**Stripe has since changed its own scheme.** Starting with a release
in 2024, Stripe ships a version every month with no breaking changes,
and a major release twice a year that may break. Monthly upgrades need
no code changes; the major ones might. It's a middle ground between
rolling date versions and big `v2`s.

**Enums are a quiet break.** Adding a value to an enum a client reads
can crash a `switch` with no default case. Stripe marks which enums
are "open" (may gain values without a new version) and tells clients to
keep a fallback branch. Microsoft recommends extensible enums unless the
set will never change.

**Webhooks have versions too.** A webhook payload is a response the
server sends without being asked. Stripe's events use the account's
default version unless the endpoint was created with its own, so
upgrading your API calls and upgrading your [[webhooks]] can be
separate steps.

**Compare with schema evolution.** Versioning chooses which behavior a
client gets. [[schema-evolution]] is about changing the bytes so old
and new readers can both still parse them. A good API needs both.

## What this means when you build

- Put a version on the API from the first release, even if it's only
  `v1` or a date.
- Keep it small: prefer many small, well-described changes over a big
  new major version.
- Pin clients to what they integrated against, and let them opt in to
  newer versions per request.
- Treat every observable behavior as part of the contract, and review
  changes before they ship.

## Further reading

- [Hyrum's Law](https://www.hyrumslaw.com/), Hyrum Wright. Why every observable behavior ends up in the contract.
- [APIs as infrastructure: future-proofing Stripe with versioning](https://stripe.com/blog/api-versioning), Brandur Leach (Stripe), 2017. Date-named versions, account pinning, and the change modules that make them cheap.
- [Stripe API reference: Versioning](https://docs.stripe.com/api/versioning), Stripe. The current scheme: monthly non-breaking versions, twice-yearly major releases, open enums.
- [Microsoft Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md), Microsoft. The query-parameter approach with date versions, and a no-breaking-changes rule.
