---
id: error-design
title: Error responses
depth: short
phase: 5
note: >-
  Status codes and error bodies a client can act on: problem details,
  and saying whether a retry can help.
needs: [http-semantics]
leads_to: []
compare_with: [retries-with-backoff]
---

# Error responses

An error response has two readers. Generic HTTP software (proxies,
caches, client libraries) looks only at the status code. Your client's
own code needs more: which error this is, in a form it can switch on,
and whether trying again can help. A good error response serves both.

## One failed purchase

A client POSTs a purchase, and the account doesn't have enough credit.
Here's the answer, adapted from the example in RFC 9457:

```http
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json

{
  "type": "https://example.com/probs/out-of-credit",
  "title": "You do not have enough credit.",
  "detail": "Your current balance is 30, but that costs 50.",
  "instance": "/account/12345/msgs/abc",
  "balance": 30
}
```

Each part has one reader in mind:

- **The status code, 403,** is for generic software. The first digit
  gives the class: 4xx means the client seems to have made a mistake,
  5xx means the server failed or can't do it. See [[http-semantics]].
- **`type`** is a URI naming the kind of problem. It's the field client
  code should branch on. If it's missing, it means `about:blank`: no
  meaning beyond the status code.
- **`title`** is a short summary of the type. It stays the same every
  time this problem happens.
- **`detail`** explains this occurrence to a human, and should help
  them fix it. Client code shouldn't parse it.
- **`instance`** identifies this one occurrence, handy for support.
- **Extensions** like `balance` carry data the client can act on. A
  client must ignore extensions it doesn't know, so you can add more
  later without breaking anyone.

This format is "problem details", RFC 9457 (2023), which replaced RFC
7807. It has its own media type, `application/problem+json`. A
validation failure fits the same shape: a 422 with a list of errors,
each pointing at the bad field with a JSON Pointer such as `#/age`.
That list is what a parser at the edge of your service produces (see
[[validation-at-boundary]]).

## The error code is part of your API

Once clients write `if (problem.type === ".../out-of-credit")`, that
string is part of the contract, like a field name. Azure's API
guidelines make it a rule for their error code header: its values
can never change. Returning a different code for a condition that
used to get the old one breaks clients. Even adding codes is handled
with care there: new top-level codes go out with a new API version. The message text, on the other hand, isn't
contract, and you can reword it to make it clearer.

That only works if clients never need to read the message. If the
message says a maximum of 16 keys are allowed, also send 16 in its own
property. Otherwise someone will parse your English, and you can't
change it without breaking them (see [[api-versioning]]).

## Can a retry help?

The most useful thing an error can tell a client is what to do next:
try again, fix something, or give up. Azure's guidelines split errors
into two kinds:

- **Runtime errors** that client code should recover from. Give each
  one its own code, so code can handle it.
- **Usage errors**, where the caller's code has a bug. Retrying won't
  help, so these can share a few common codes.

The status class is a first hint, not the answer. A 4xx isn't always
permanent: a 409 Conflict can succeed after the client re-reads and
resubmits. A 5xx isn't always temporary. That's why HTTP asks both
4xx and 5xx responses to say whether the condition is temporary or
permanent.

For "try again later", HTTP has a header. `Retry-After` gives a delay
in seconds or a date, and with a 503 it says how long the service
expects to be unavailable. A problem type can call for it. Clients
should back off on that header, never on text in the message. Whether
a retry is *safe* is a separate question, which depends on whether the
operation is [[idempotency|idempotent]]. How to space retries out is
[[retries-with-backoff]].

## Where it gets tricky

**The status might not be yours.** A proxy or cache can change the
status code on the way, and generic software like caches and
proxies won't read your body.
The `status` field inside a problem details object can then disagree
with the real status line, and generic software will follow the real
one. Clients have to cope with errors that carry no problem body at
all.

**Leaking internals.** Problem details describe the HTTP interface,
not your implementation. A stack trace in `detail` tells an attacker
about your code and data.

**Several problems at once.** If one request has problems of different
types, send the most urgent one. Lists work only inside one type that
was designed for them, like the validation errors above.

**Not every error needs a type.** A 403 to a PUT already says "you
can't write this". Use plain status codes for generic problems and
define types for the ones specific to your API.

**Formats differ.** Azure sends `{"error": {"code": ...}}` plus an
`x-ms-error-code` header instead of a `type` URI. The idea is the
same.

## What this means when you build

- Use one error format for the whole API. `application/problem+json`
  is the standard one.
- Give every error a stable, documented code or type, and never change
  it for an existing condition.
- Put values the client needs in fields, not only in the message.
- Tell the client whether to retry: the right status, a specific code,
  and `Retry-After` when waiting will help.
- Never put stack traces or internal details in an error body.

## Further reading

- [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457), Nottingham, Wilde, Dalal, 2023. Problem details: the fields, extensions, the validation example, and the security notes.
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham, Reschke (editors), 2022. What 4xx and 5xx mean, 409 and 422, and the Retry-After header.
- [Microsoft Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md), Microsoft. The Handling Errors section: recoverable vs usage errors, and error codes as part of the contract.
