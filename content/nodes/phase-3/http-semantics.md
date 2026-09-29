---
id: http-semantics
title: HTTP semantics
depth: deep
phase: 3
note: >-
  What HTTP methods, status codes and headers mean in every HTTP
  version, including which methods are safe and idempotent.
needs: [tcp]
leads_to: [http-1-1, http-caching, api-design, rest, error-design, idempotency, request-signing, rate-limiting, distributed-tracing, cookies, ssrf, same-origin-policy, object-storage, long-polling]
compare_with: []
---


# HTTP semantics

HTTP semantics is the meaning of an HTTP exchange: what a method asks
the server to do, what a status code says happened, what a header
field means. That meaning is the same whether the bytes travel as
HTTP/1.1 text, [[http2|HTTP/2]] frames or [[http3|HTTP/3]] over
[[quic|QUIC]]. It decides which
requests a client or proxy may safely retry, what a cache may keep, and
what your API promises to every piece of software between you and your
users.

## One exchange, taken apart

Here's a request to replace a user's avatar, and the reply:

```
PUT /users/42/avatar HTTP/1.1
Host: api.example.com
Content-Type: image/png
Content-Length: 5120

<5120 bytes of PNG>
```

```
HTTP/1.1 204 No Content
```

Strip away the syntax and every HTTP message has the same four parts:

- **Control data.** For a request, the method (`PUT`) and the target
  (`/users/42/avatar`). For a response, the status code (`204`).
- **Headers.** Name/value pairs about the message, the content or the
  sender: `Host`, `Content-Type`.
- **Content.** The bytes the message carries, possibly a stream of
  unknown length.
- **Trailers.** Optional name/value pairs sent after the content, for
  things only known once it's all sent.

Each HTTP version has its own way of writing these parts down and of
marking where a message ends. [[http-1-1]] uses lines of text; HTTP/2
and HTTP/3 use binary frames. The meaning above sits on top of all of
them, and a proxy can take a message in one version and pass it on in
another without changing what it means. Every version runs over a
reliable connection underneath, such as [[tcp]].

This split is recent in the specs. Until 2022, HTTP's meaning was
defined together with HTTP/1.1's syntax (RFC 7230 to 7235, and before
that RFC 2616). In 2022 it was rewritten as three documents: RFC 9110
for semantics, RFC 9111 for caching, and RFC 9112 for HTTP/1.1's wire
format.

## Resources, representations, and no memory

The target, `/users/42/avatar`, names a **resource**. HTTP doesn't care
what a resource is behind the server: a file, a database row, a call to
another system. You never move the resource itself. You move
**representations** of it: a PNG of the avatar now, or the PNG you want
it to become.

HTTP is **stateless**: each request can be understood on its own,
without knowing which requests came before it on the same connection. A
server must not assume two requests on one connection come from the
same user unless the connection is secured and belongs to that user.
That's what lets proxies reuse one backend connection for many clients,
and load balancers send each request to a different server.

## Methods say what you want done

The method carries the meaning of the request. The URL only says which
resource it applies to. The common methods:

| Method | Asks the server to | Safe | Idempotent |
|---|---|---|---|
| `GET` | send the current representation | yes | yes |
| `HEAD` | same as GET, headers only | yes | yes |
| `OPTIONS` | describe what the resource supports | yes | yes |
| `PUT` | replace the resource's state with this one | no | yes |
| `DELETE` | remove the resource | no | yes |
| `POST` | process this content, in whatever way the resource defines | no | no |
| `PATCH` | apply this set of changes | no | no |

Only GET and HEAD are required on a general-purpose server; everything
else is optional. A server that doesn't know a method at all answers
501 (Not Implemented). One that knows it but doesn't allow it on this
resource answers 405 (Method Not Allowed). PATCH isn't in the core spec;
it was added separately in 2010 (RFC 5789).

POST is the catch-all. Its meaning is whatever the resource says it is:
submitting a form, appending to a log, creating a new resource. When a
POST creates something, the server answers 201 (Created) with a
`Location` header pointing at it.

The two properties in the table matter more than any single method.

![Two nested sets inside all methods. The inner set, safe methods, holds GET, HEAD, OPTIONS and TRACE. The middle set, idempotent methods, holds everything safe plus PUT and DELETE. Outside both are POST, PATCH and CONNECT, which are neither. A note says a proxy may retry idempotent requests on its own, and must never retry the others.](img/http-semantics-method-properties.svg)

*Every safe method is idempotent, but not the other way round. Drawn from the method definitions in RFC 9110 section 9 and RFC 5789.*

## Safe: the client asked for nothing to change

A method is **safe** if its meaning is read-only: the client doesn't
ask for, or expect, any change on the server. GET, HEAD, OPTIONS and
TRACE are safe.

Safe is about what the client asked for, not about everything the
server does. A server that writes every GET to an access log is still
serving a safe method. What matters is that the client didn't ask for
the side effect and can't be blamed for it.

This is why crawlers, link checkers and browsers that prefetch pages
feel free to GET any link they find. If your app deletes things on
`GET /page?do=delete`, one of them will eventually delete things. When
a URL parameter selects an unsafe action, the server has to refuse that
action for safe methods.

## Idempotent: twice has the same effect as once

A method is **[[idempotency|idempotent]]** if sending the same request several times
has the same intended effect on the server as sending it once. PUT,
DELETE and all the safe methods are idempotent. PUT the same avatar
twice, and the avatar is that picture. DELETE it twice, and it's gone.

The responses can differ even though the effect is the same: the
second DELETE may well get a different status than the first. And as
with safe, idempotence is about what was requested. The server may
still log each request or keep a revision history.

Idempotence exists for one practical reason: **retries after a
connection failure**. Say a client sends a PUT and the connection dies
before any response arrives. The client can't know if the server
applied it. Because PUT is idempotent, it can open a new connection and
send it again; the end state is the same either way.

With a non-idempotent method like POST, a blind retry might charge a
card twice. So the rules are:

- A client shouldn't retry a non-idempotent request automatically,
  unless it has some other way to know the request is safe to repeat,
  or that the first one never happened.
- A proxy must never retry a non-idempotent request on its own.

Some clients take a risk anyway and retry a POST when an idle
persistent connection closes before any response arrives, betting the
server never saw it. That bet is the reason to design endpoints that
can tell a repeated POST from a new one.

PATCH is neither safe nor idempotent. A patch like "add 1 to the
balance" gives a different result each time it's applied. You can make
a PATCH safe to repeat by making it conditional, so it only applies if
the resource hasn't changed since you last read it.

## Status codes: a class, then a detail

A status code is three digits from 100 to 599. The first digit is the
class:

- **1xx, informational.** An interim response; the real one follows.
- **2xx, success.** The request was received, understood and accepted.
- **3xx, redirection.** The client has to do something more, usually
  follow the `Location` header.
- **4xx, client error.** Something is wrong with the request.
- **5xx, server error.** The request looked valid and the server failed
  to carry it out.

The last two digits give the specific meaning. A client must understand
the class of every code, and treat a code it doesn't know as the x00 of
that class. A client that gets an unknown 471 handles it as a 400. This
is how new codes get added without breaking old clients.

One request can get zero or more 1xx responses, then exactly one final
response. The text after the number, like "No Content", is only a
suggestion. Nothing should depend on it, and HTTP/2 doesn't carry it at
all.

Codes carry specific effects that generic HTTP software acts on, without
knowing your application:

- **301 and 308** say the resource moved for good; **302 and 307** say
  it's elsewhere for now. Browsers historically turned a redirected
  POST into a GET for 301 and 302, and the spec now allows that. 307
  and 308 were added so a redirect can keep the method.
- **401** means the request lacks valid credentials; it must come with
  a `WWW-Authenticate` header saying how to authenticate. **403** means
  the server understood and refuses. A server may answer 404 instead of
  403 to hide that the resource exists.
- **404** can be cached by some caches, and crawlers read it as "this is
  gone".
- **429** says the client is being [[rate-limiting|rate-limited]] and should slow down.
- **502, 503 and 504** come from different places. 502 means a proxy or
  gateway got an invalid response from the server behind it. 504 means
  it got no response in time. 503 means the server is overloaded or
  down for maintenance for a while, and it can say when to come back
  with `Retry-After`.

That last group points to the thing people miss: **your application
isn't the only thing that sends status codes**. A proxy, a [[cdn|CDN]], a
captive portal or an overloaded server in front of you can answer
instead of your code. Any list of "codes this endpoint returns" is
incomplete.

## Headers: open-ended metadata

Header field names are case-insensitive. If the same name appears on
several lines, the values join into one comma-separated list, in order.
`Set-Cookie` is the exception that can't be joined, and has to be
handled specially.

New headers can be invented without a new HTTP version. A proxy must
pass on headers it doesn't recognise, and other recipients ignore them.
That's how HTTP extends without upgrading every box in the middle.

Some headers are meant only for the next hop, not the whole path. The
`Connection` header lists them, and each intermediary removes the
listed headers, and `Connection` itself, before forwarding. A few are
always hop-by-hop whether listed or not, including `Keep-Alive`,
`Transfer-Encoding`, `TE` and `Upgrade`.

`Host` carries the name from the URL, so one server can host many
names. Since routing depends on it, a forged `Host` is a classic way to
poison a shared cache or reach an internal server.

The spec sets no size limit on headers. A server that gets headers
bigger than it's willing to handle must answer with a 4xx, not quietly
drop them, because ignoring part of a request is one way two machines
end up disagreeing about it. For the same reason, a server must not
act on a request until it has read all of its headers.

## Where it gets tricky

**The spec defines intent, not implementation.** Nothing stops a GET
handler from writing to your database. The server stays "correct" in
the sense that the client didn't ask for it; your users and every
retrying client will still suffer. Safe and idempotent are promises you
make by how you build handlers.

**How fine-grained should status codes be?** A common style gives every
application error its own code. The people who edit the HTTP specs
argue the other way: status codes are generic, meant for software that
knows nothing about your app, so using 200, 400 and 500 when nothing
fits better is fine, and the details belong in the response body (a
standard "problem details" format exists for that). Applications must
not redefine what a code means, and promising "this POST always returns
201" makes clients brittle, because a proxy can always answer
something else.

**202 Accepted says nothing about the outcome.** It means "queued".
The client has to find out whether the work succeeded some other way,
and your API has to say how.

**Old references.** Plenty of tutorials still cite RFC 2616 (1999) or
RFC 7231 (2014). Both are obsolete. The editors' advice is not to
memorise RFC numbers at all, since they only name one version of the
documents.

**GET with a body.** The syntax allows content in a GET, but it has no
defined meaning, and generic software ignores or rejects it. Some
servers reject it outright, because a body where none is expected can
be used for [[request-smuggling]].

**Order between requests isn't part of the meaning.** Two requests on
the same connection may be handled in any order, by different servers.
If the second must happen after the first, send it only once the
response to the first has started arriving.

## What this means when you build

- Make GET and HEAD handlers read-only, and PUT and DELETE handlers
  idempotent. Clients, crawlers and proxies will retry them.
- In a [[reverse-proxy]], retry only idempotent requests. Never retry a
  POST or PATCH on the client's behalf.
- If a POST must be safe to retry, give the server a way to recognise a
  repeat.
- Treat any 2xx as success in clients. Handle unknown codes by their
  class.
- Use the most specific status code that fits, 200, 400 and 500 when
  none does, and put application details in the body. Never parse the
  reason phrase.
- When you forward a request, strip the headers listed in `Connection`
  and the other hop-by-hop ones.
- Answer oversized headers with a 4xx instead of dropping them.

## Further reading

- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), R. Fielding, M. Nottingham, J. Reschke (editors), IETF, 2022. The definition itself: messages, fields, methods, safe and idempotent, status codes, intermediaries.
- [RFC 9205](https://www.rfc-editor.org/rfc/rfc9205), M. Nottingham, IETF, 2022. Best practice for building APIs on HTTP: don't redefine methods or codes, what GET must not do, choosing status codes.
- [RFC 5789](https://www.rfc-editor.org/rfc/rfc5789), L. Dusseault, J. Snell, IETF, 2010. PATCH, how it differs from PUT, and why it isn't idempotent.
- [How to Think About HTTP Status Codes](https://www.mnot.net/blog/2017/05/11/status_codes), Mark Nottingham, 2017. A spec editor on picking status codes, in plain words.
- [A New Definition of HTTP](https://www.mnot.net/blog/2022/06/06/http-core), Mark Nottingham, 2022. Why HTTP was split into semantics, caching and HTTP/1.1 in 2022.
