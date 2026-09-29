---
id: validation-at-boundary
title: Validation at the boundary
depth: short
phase: 5
note: >-
  Parse and check outside data once, where it enters, and trust it
  inside.
needs: [api-design]
leads_to: []
compare_with: [sql-injection]
---

# Validation at the boundary

Data from outside your service can be anything: request bodies, query
strings, headers, a partner's nightly feed. Validation at the boundary
means checking it once, where it enters, and turning it into types the
rest of your code can trust. After that point, nothing checks again,
because nothing needs to. Every [[api-design|API]] has this edge, and
deciding what gets through it is part of designing the API.

## A signup request, two ways

A client sends this:

```json
{ "email": "ana@example.org", "age": "42", "plan": "pro" }
```

**Checking and passing it on.** The handler checks that `age` is a
number, `email` has an `@` and `plan` is one of the known plans. Then
it passes the same raw JSON object deeper into the code. The checks
returned nothing, so everything they learned is gone. Code three calls
down converts `age` to a number again, just in case. Or it doesn't,
because "the handler already checked". Months later someone moves a
check, and a case that was "impossible" deep inside starts happening.

**Parsing it.** The handler calls one function:

```ts
parseSignup(raw: unknown): Signup | ValidationErrors
```

`Signup` has an `Email` type, an `age` that is an integer in a
sensible range, and a `plan` that is an enum, not a string. The
function either returns a `Signup` or a list of what's wrong.
Everything after it takes a `Signup`, never the raw object. The type
itself is the record that the checks happened, and in a typed
language the compiler catches any path that tries to skip them.

Alexis King named this idea "parse, don't validate" (2019). A parser
here is any function that takes less-structured input and gives back
more-structured output. A validator that returns nothing throws that
structure away.

## Why once, and why at the edge

When checks are scattered through the code that does the work, the
program can act on the valid part of a request before it finds the
invalid part. Then it has to undo what it did, which a database
transaction can do, but a sent email or a charged card can't. The
LangSec name for scattered checks is shotgun parsing. Parsing up
front splits the work into two phases, parse then execute, and bad
input can only fail in the first one.

The edge is the right place because it's the first place you can
check. Validate as soon as data arrives from anyone outside: browsers,
mobile apps, other companies' systems, your own partners' feeds. Any
of them can send malformed data. Checks in the browser are only for
the user's convenience: anyone can skip them by talking to your API
directly, so the server has to check again.

Two habits make parsing work:

- **Types that can't hold bad values.** An enum can't hold a plan that
  doesn't exist. A map can't hold duplicate keys. Pick the most precise
  type you reasonably can.
- **Checked constructors when a type can't say it.** Many type
  systems can't express "an integer from 13 to 130". Wrap it in a type whose
  only constructor checks the range, so any value of that type is known
  to be good.

## What to check

- **Syntax:** is it well formed? A date is a date, a number is a
  number, a string is within its length limits.
- **Meaning:** does it make sense here? The start date is before the
  end date, the price is within the expected range.
- **Allowlists, not denylists.** Say what's allowed and reject the
  rest. Blocking "dangerous" characters is easy to get around, and it
  rejects real input: a denylist that bans `'` also bans O'Brian.
- **Limits.** Minimum and maximum lengths and values, anchored regular
  expressions (`^...$`), and a maximum size for uploads. A badly written regex can itself be a denial-of-service hole.

When parsing fails, return an error that says what's wrong with each
field, so the caller can fix everything in one go (see
[[error-design]]).

## Where it gets tricky

**Valid isn't safe.** O'Brian is a valid name and contains a quote.
Input validation isn't the main defence against injection. You still
need parameterized queries ([[sql-injection]]) and output encoding,
wherever the data ends up.

**Some checks need state.** "This email isn't taken" needs the
database. Parse as much as you can at the edge, and when a code path
needs a more precise type, parse into it as soon as that path is
chosen, still before acting on the data.

**Email addresses.** The formal syntax allows strange addresses, and
real mail servers reject many of them. A light check (one `@`, no
dangerous characters, a sane length) plus actually sending a
confirmation email tells you more than any regular expression.

**Order matters for cost.** Sometimes you should check who's calling
before parsing a large body, so strangers can't make you do expensive
parsing work for free.

## What this means when you build

- Write one parse function per kind of input, called at the handler's
  edge. Everything behind it takes the parsed type.
- Validate on the server, always. Client-side checks are for users.
- Use allowlists, ranges, lengths and size limits.
- Report every bad field in one error response.
- Keep parameterized queries and output encoding. Validation doesn't
  replace them.

## Further reading

- [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/), Alexis King, 2019. The idea of keeping what a check learned as a type, and shotgun parsing. Examples in Haskell.
- [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), OWASP. Where to validate, syntactic vs semantic checks, allowlists, regex and email pitfalls.
