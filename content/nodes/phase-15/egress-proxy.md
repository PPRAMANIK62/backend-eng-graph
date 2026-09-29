---
id: egress-proxy
title: Egress proxies
depth: short
phase: 15
note: >-
  Sending every outbound request through one proxy that refuses internal
  addresses. A defence against SSRF.
needs: [ssrf, reverse-proxy]
leads_to: []
compare_with: []
---

# Egress proxies

An egress proxy is a single door for a company's outbound requests.
Services that fetch URLs chosen by users (webhooks, link previews,
image imports) send those requests through the proxy instead of
connecting directly. The proxy decides which destinations are allowed,
and above all refuses internal ones. It's the most dependable defense
against [[ssrf]], because the check lives in one tested place instead of
in every service that makes a request. Where a [[reverse-proxy]] stands
in front of your servers for traffic coming in, an egress proxy stands
in front of them for traffic going out.

## Why checking in each service keeps failing

A server-side request forgery attack tricks your server into fetching
an internal address: a metadata endpoint, an admin panel, a database. The
obvious fix is to check the URL before fetching it. In practice every
service writes that check slightly differently, and the checks have
known holes. IP addresses can be written in hex or octal forms that
parsers disagree about. A name that was allowed when checked is resolved
again when the request is made, and can point somewhere else the second
time: the [[dns-rebinding]] trick, which OWASP's cheat sheet calls the
DNS pinning bypass.

## What the proxy does

Stripe's open-source Smokescreen is a good example. It's an HTTP
CONNECT proxy that carries most of Stripe's traffic to the outside
world, webhooks included.

1. **A service asks the proxy to connect** to a host and port.
2. **The proxy resolves the name itself** and checks that the address is
   publicly routable, not internal. Because the proxy both checks and
   connects to the same address, a second DNS answer can't slip in
   between.
3. **It checks who's asking.** Clients connect over [[mtls|mTLS]], so
   the proxy knows which service is calling and can apply that service's
   own list of allowed destinations.
4. **It connects,** and the service's bytes flow through.

Extra address ranges can be denied or allowed with CIDR rules. Stripe's
reason for building it was concrete: stopping its own webhook system
from being used to scan Stripe's internal network.

A side benefit: all outbound traffic leaves through the proxy's
addresses, so partners can allow-list a few stable IPs.

## Where it gets tricky

**Services must not have another way out.** A proxy only helps if
traffic can't go around it. Firewall the machines that fetch user URLs
so their only outbound path is the proxy, at the network layer.

**Block addresses, not names.** A hostname deny-list only blocks those
names, not the address behind them. Smokescreen's docs warn about
exactly this for its own name list. Rules that matter should be on the
resolved address.

**It's a critical path.** Every webhook and outbound call now depends on
the proxy being up and fast. Run it redundantly, and watch its latency
like any other dependency.

## What this means when you build

- Route every request to a user-supplied URL through one egress proxy
  that resolves names itself and refuses internal addresses.
- Identify callers (mTLS or another credential) and give each its own
  allowed destinations.
- Make the proxy the only way out for those services, enforced by the
  network.
- Keep the application-level checks too; the proxy is the backstop,
  not the only layer.

## Further reading

- [Smokescreen](https://github.com/stripe/smokescreen), Stripe. An HTTP CONNECT egress proxy that resolves and checks every destination, with per-client rules over mTLS.
- [Server-Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), OWASP. Why URL and IP checks fail, the DNS pinning bypass, and network-layer controls.
