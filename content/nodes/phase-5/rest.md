---
id: rest
title: REST
depth: deep
phase: 5
note: >-
  What Fielding defined, and what "REST API" means in practice.
needs: [http-semantics]
leads_to: [openapi]
compare_with: [grpc, graphql, api-design]
---

# REST

REST is the name Roy Fielding gave, in his 2000 PhD dissertation, to
the architectural style behind the Web: a set of rules for how
clients, servers and the machines between them talk. In everyday use,
"REST API" means something much looser: JSON over HTTP, nouns in the
URLs, and the HTTP methods used the way HTTP defines them. Knowing both
meanings tells you which of the Web's properties your API actually
gets, and which ones it gave up.

## REST is a list of constraints, added one at a time

Fielding didn't define REST as a protocol or a format. He started from
a system with no rules at all and added constraints one by one, each
for a property it brings and a price it costs. The finished list is
REST.

![A table of the six constraints in the order they are added. 1, client-server: UI and storage separate, each side evolves on its own. 2, stateless: buys visibility, reliability and scalability, costs the same data resent in every request. 3, cache: some requests never reach the server, costs stale data. 4, uniform interface, highlighted: one generic interface and decoupled implementations, costs efficiency compared with a format built for one app. 5, layered system: proxies, load balancers, shared caches and firewalls, costs latency per layer. 6, code on demand, optional: clients extended with downloaded scripts, costs visibility.](img/rest-constraints.svg)

*Each constraint is added on top of the ones before it. Adapted from Roy Fielding, "Architectural Styles and the Design of Network-based Software Architectures", chapter 5, figures 5-1 to 5-8 (2000).*

**Client-server.** The user interface is separated from data storage.
The main win for the Web is that the two sides can change on their
own, which matters when they belong to different organizations.

**Stateless.** Every request carries everything the server needs to
understand it. The server keeps no session between requests; any
session state lives on the client. That buys three things. A monitor
can understand a request by looking at that one request. Recovering
from a partial failure is easier. And a server can free its resources
as soon as it answers. The price is that the same data (who you are,
what you're looking at) gets sent again with every request, and the
server has to trust every client version to keep its own state
correctly.

**Cache.** Every response is marked, explicitly or implicitly, as
cacheable or not. If it's cacheable, a cache may reuse it for a later
equivalent request, so some interactions disappear entirely. The price
is that a cached copy can be stale.

**Uniform interface.** This is the constraint that sets REST apart
from other styles. Every component talks through the same generic
interface, so a cache or proxy can handle any resource without knowing
what application it belongs to. The price is efficiency: data moves in
a standard form, not one built for your app. Fielding tuned REST for
moving large pieces of hypermedia, the common case on the Web, and said
openly that it isn't optimal for other kinds of interaction.

**Layered system.** A component only sees the layer it talks to. That
lets intermediaries sit in the path: load balancers, shared caches,
firewalls at an organization's edge. Each layer adds latency, which
shared caching can win back.

**Code on demand.** A server can send code (scripts, in today's terms)
that the client runs. It's optional, because it makes messages harder
for intermediaries to understand.

## The uniform interface, in four parts

Fielding broke the uniform interface into four constraints.

1. **Resources are identified.** A resource is anything that can be
   named: a document, a person, "today's weather in Los Angeles", a
   collection of other resources. It's a concept that maps to
   different values over time, not a fixed thing. "The authors'
   preferred version of this paper" and "the version printed in the
   proceedings" are two different resources, even on a day when both
   point to the same bytes. A URL is the identifier.
2. **Resources are handled through representations.** You never send
   a resource itself. You send a representation of its current or
   intended state: a sequence of bytes plus metadata that describes
   them. The format of those bytes is the media type, such as an HTML
   page, a JPEG or a JSON document.
3. **Messages describe themselves.** A message carries its own method,
   media type and caching rules, so anything in the path can act on
   it without knowing the application. A cache can decide what's
   cacheable precisely because the interface is the same for every
   resource.
4. **Hypermedia drives the application state.** A representation
   includes the links and forms that are the possible next steps. The
   client moves from state to state by choosing among them, the way
   you use a website by clicking links rather than typing URLs.

## How HTTP carries it

REST and HTTP grew up together: Fielding applied REST while writing
the HTTP/1.1 and URI standards, and he's an editor of the current HTTP
spec, RFC 9110. So most of REST shows up directly in
[[http-semantics|HTTP's semantics]]. A request names its target with a
URL and states its intent with a method. The methods mean the same
thing for every resource: `GET` is safe, so crawlers, prefetchers and
caches can call it freely, and `PUT` and `DELETE` are
[[idempotency|idempotent]], so a client can repeat them after a network
failure. HTTP is stateless:
each request can be understood on its own. And because messages
describe themselves, [[reverse-proxy|reverse proxies]] and
[[http-caching|HTTP caches]] can do their job without knowing anything
about your application.

## Hypermedia: the constraint almost everyone skips

In 2008 Fielding wrote a blog post complaining that people call any
HTTP-based interface a REST API. His rules for what a REST API must
do are strict:

- It must not define fixed resource names or URL hierarchies. The
  server controls its own namespace and tells clients how to build
  URLs, through links and forms in its responses.
- A client should need nothing but the entry URL (a bookmark) and some
  standard media types. Every step after that comes from choices the
  server offered in the last response.
- The documentation should mostly describe media types and link
  relations, not lists of URLs and which methods to call on them.
- The client shouldn't care what "type" a resource is, only what media
  type the current representation has.

If an API doesn't follow these, he wrote, choose some other buzzword.

Here's what that looks like. Instead of documenting "to pay, POST to
`/orders/{id}/payment`", the order itself says what you can do next:

```json
{
  "status": "unpaid",
  "total": "30.00",
  "links": [
    { "rel": "payment", "href": "/orders/42/payment" },
    { "rel": "cancel",  "href": "/orders/42" }
  ]
}
```

The client looks for the link named `payment` and follows it. If the
server moves payments to a new URL, clients don't break, because they
never built the URL themselves. If the order is already paid, the link
just isn't there. The server can also advertise a new feature by
adding a new link. What's missing is a standard: there's no single
agreed format for writing these links in JSON.

The IETF's advice for protocols built on HTTP, RFC 9205, leans the
same way for standards: rather than fixing URL paths, a client should
start from one discovery document and follow links from it. It also
notes that a single-deployment API fixing a prefix like `/app/v1` is
common practice.

## The Richardson maturity model

Leonard Richardson described a ladder that helps place a real API
against all this. Martin Fowler's write-up uses the example of booking
a doctor's appointment.

![A staircase of four levels. Level 0: one endpoint with RPC tunnelled in POST, for example POST /appointmentService, and 200 OK even for a failure. Level 1: resources, POST /doctors/mjones and POST /slots/1234. Level 2: HTTP methods and status codes, GET /doctors/mjones/slots?status=open and POST /slots/1234 returning 201 or 409. Level 3, highlighted: hypermedia controls, the response lists links such as book pointing to /slots/1234. Fielding treats level 3 as a precondition for calling it REST.](img/rest-maturity-levels.svg)

*The Richardson maturity model. Adapted from Martin Fowler, "Richardson Maturity Model" (2010), figure 1 and its examples.*

- **Level 0** uses HTTP as a tunnel. Every request is a `POST` to one
  endpoint with an XML or JSON document saying what to do. Even a
  failure comes back as `200 OK` with the error in the body. This is
  RPC.
- **Level 1** introduces resources. You talk to `/doctors/mjones` and
  `/slots/1234` instead of one service endpoint.
- **Level 2** uses the methods and status codes as HTTP defines them.
  Reading open slots is a `GET`, so it can be cached. Booking returns
  `201 Created` with a `Location`, and a slot someone else just took
  returns `409 Conflict`.
- **Level 3** adds hypermedia: each slot in the response carries a
  link to book it, and the booked appointment carries links to cancel
  it or add tests.

Fielding treats level 3 as a precondition for calling something REST.

## What "REST API" means in practice

Look at a big provider's published rules and you'll find level 2.
Microsoft's Azure guidelines, for example, describe REST as modeling
resources as collections, fix a URL pattern
(`/<collection>/<id>`) that clients construct themselves, and specify
which HTTP method to use for create, read, update and delete. That's
resources, methods and status codes, with the URL layout written down
in the documentation, often as an [[openapi|OpenAPI]] description.
By Fielding's rules that's not REST. It's still a large step up from
level 0, because it keeps what Fowler argues the Web really proves
works: a strong split between safe and unsafe operations, and status
codes that tell you what kind of error you hit.

## Where it gets tricky

**Two meanings of one word.** Fielding coined the term and his
definition requires hypermedia. The industry uses it for level 2. Both
uses are here to stay. When it matters, say which one you mean, and
don't expect the benefits of hypermedia (URLs that can move, clients
that discover features) from an API that doesn't have it.

**`POST` and `PUT` are not create and update.** People often map them
that way. `PUT` means "make the state at this URL equal to this", which
is why it's idempotent and can create a resource at a URL the client
chose. `POST` means "process this according to the resource's own
rules", which can create a resource at a URL the server picks, or do
something else entirely.

**The Web itself barely uses `PUT` and `DELETE`.** Browsers have long
treated HTML's short list of methods as if it were HTTP's, which
Fielding calls a workaround for broken implementations. So "the Web
proves it works" is a weak argument for using every method; the strong
argument is the safe/unsafe split.

**Stateless has a cost you pay per request.** Credentials and context
travel with every request instead of sitting in a server-side session.
That's the trade Fielding made on purpose, for visibility and
scalability.

**Uniform means less efficient.** A generic interface moves whole
representations in standard formats. For a screen that needs a few
fields from ten resources, or for high-volume service-to-service
calls, that's a poor fit. [[graphql|GraphQL]] and [[grpc|gRPC]] both give up
some of the uniform interface's generality to win back that
efficiency.

**REST isn't HTTP.** In Fielding's definition, a REST API shouldn't
depend on any single protocol. HTTP is just the protocol the Web uses.

## What this means when you build

- Say "level 2" to yourself, and build it well: resources in URLs,
  methods that mean what HTTP says they mean, and real status codes
  with useful [[error-design|error bodies]].
- Never let a `GET` change anything. Caches, crawlers and retries all
  assume it doesn't.
- Keep requests stateless, so any server behind a
  [[load-balancing|load balancer]] can answer any request.
- Where URLs might change (the next page of a list, a status to poll),
  hand the client a link instead of making it build one. That's a
  small piece of level 3 that pays off immediately.
- Design the resources first, as in [[api-design]]; REST says how to
  expose them, not what they should be.

## Further reading

- [Architectural Styles and the Design of Network-based Software Architectures, chapter 5](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm), Roy Fielding, 2000. The definition: each constraint, what it buys and what it costs.
- [REST APIs must be hypertext-driven](https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven), Roy Fielding, 2008. The rules most "REST APIs" break, from the person who coined the term.
- [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html), Martin Fowler, 2010. The four levels with a worked example; the clearest way to place a real API.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham, Reschke (eds.), IETF, 2022. How HTTP's methods, statelessness and intermediaries carry REST's constraints.
- [RFC 9205: Building Protocols with HTTP](https://www.rfc-editor.org/rfc/rfc9205), Mark Nottingham, IETF, 2022. Why standards should use links instead of fixed URL paths.
- [Microsoft Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md), Microsoft. What a large provider means by REST in practice.
