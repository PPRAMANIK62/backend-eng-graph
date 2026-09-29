---
id: api-gateway
title: API gateways
depth: short
phase: 5
note: >-
  One front door for many services: auth, limits, routing.
needs: [reverse-proxy, rate-limiting]
leads_to: []
compare_with: [service-mesh]
---

# API gateways

An API gateway is a [[reverse-proxy|reverse proxy]] that serves as the
single public entry point to an API built from many services. Besides
sending each request to the right service, it does the jobs every
service would otherwise repeat: checking who's calling, applying
[[rate-limiting|rate limits]], and sometimes combining several services'
answers into one. Clients see one API. How it's split into services
behind the gateway can change without them noticing.

## What happens to one request

Take an online shop split into services: product info, inventory, and
order history. A mobile app wants to show one product page.

![Three kinds of client on the left: a web app, a mobile app and a third-party developer. All of them call one API gateway in the middle. The gateway authenticates the caller, applies that client's rate limit, and then either routes the request to one service or fans it out to several and combines the answers. On the right are the product, inventory and order services.](img/api-gateway-front-door.svg)

*One front door for many services. Adapted from Chris Richardson, "Pattern: API Gateway / Backends for Frontends" (microservices.io).*

1. **Who is this?** The gateway checks the caller's credentials. It can
   then pass the user's identity on to the services as a token, so
   each service doesn't have to authenticate the user again.
2. **Is this caller over its limit?** Amazon's API Gateway, for example,
   keeps a [[rate-limiting-algorithms|token bucket]] per client, found by
   the client's [[api-keys|API key]], and answers 429 when it's empty.
3. **Where does it go?** Some requests pass straight through to one
   service. Others fan out: the gateway calls product info, inventory
   and order history, and returns one combined answer. For the app,
   that's one round trip instead of three, which matters most on a slow
   mobile network.

Around that, a gateway product can take on more. Amazon's API Gateway,
for one, adds monitoring and logging, managing
[[api-versioning|API versions]], and rolling out changes to a small
share of traffic first, in front of any kind of backend: servers,
functions, or other web applications.

## One gateway per kind of client

Different clients want different things. A desktop web page shows more
about a product than a phone screen does, and a third-party developer
wants a plain, general-purpose API. One variant, called **Backends for
Frontends**, runs a separate gateway for each kind of client, each
exposing the API that client needs.

## Where it gets tricky

**It's one more thing on every request's path.** The gateway adds a
network hop, and it's another piece to build, deploy and keep running.
Every request goes through it, so an outage or a bad config change in
the gateway hits every API at once.

**Gateway, reverse proxy, or service mesh?** A gateway is a reverse
proxy with API-specific jobs added, and the line between them is
blurry. A [[service-mesh]] is the other proxy layer it gets confused
with. The gateway is the single entry point for clients, so its job is
the calls coming in from outside.

**Limits are layered and approximate.** Amazon's API Gateway applies
limits at several levels at once (across AWS in a region, per account,
per API stage or method, and per client) and calls all of them
best-effort targets rather than exact ceilings.

**Fanning out means partial failure.** When the gateway combines three
services' answers, it has to decide what to return when one of them is
slow or down. Each call needs its own [[timeouts|timeout]], the pattern
pairs the gateway with [[circuit-breakers]], and a combined page may
have to go out with a piece missing.

## What this means when you build

- Put authentication, per-client rate limits and routing in the
  gateway, so each service doesn't implement them again.
- Keep business logic in the services. The gateway routes, checks and
  combines.
- Give each call the gateway makes a timeout, and decide what a
  combined response looks like when one part fails.
- Treat gateway config like code: reviewed, tested, and rolled out in
  stages, because it touches every request.

## Further reading

- [Pattern: API Gateway / Backends for Frontends](https://microservices.io/patterns/apigateway.html), Chris Richardson, microservices.io. The pattern, why microservices need it, the BFF variant, and its costs.
- [What is Amazon API Gateway?](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html), AWS docs. What a managed gateway product actually takes on.
- [Throttle requests to your REST APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html), AWS docs. Token-bucket limits per client and the layers they stack in.
