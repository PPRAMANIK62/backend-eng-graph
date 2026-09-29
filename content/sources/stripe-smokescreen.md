---
id: stripe-smokescreen
title: "Smokescreen (README)"
author: Stripe
url: https://github.com/stripe/smokescreen
kind: code
primary: true
---

## Summary

The README of Smokescreen, Stripe's open-source egress proxy (Go). Most
of Stripe's outbound traffic, webhooks included, goes through it. It
checks hostnames against per-client ACLs and refuses to connect to
internal IP addresses after resolving the name itself.

## Key claims

- It's an HTTP CONNECT proxy that carries Stripe's outbound traffic, webhooks included. "Smokescreen is a HTTP CONNECT proxy. It proxies most traffic from Stripe to the external world (e.g., webhooks)." (intro)
- It resolves each name itself and allows only public addresses. "It also resolves each domain name that is requested, and ensures that it is a publicly routable IP address and not an internal IP address." (intro)
- The reason: webhooks used to scan the internal network. "This prevents a class of attacks where, for instance, our own webhooks infrastructure is used to scan Stripe’s internal network." (intro)
- It also gives partners stable egress IPs. "Smokescreen also allows us to centralize egress from Stripe, allowing us to give financial partners stable egress IP addresses" (intro)
- Clients authenticate with mTLS and get per-client ACLs. "In typical usage, clients contact Smokescreen over mTLS." (intro)
- Extra ranges can be blocked or allowed: `--deny-range` and `--allow-range` in CIDR notation. (Usage, CLI)
- A hostname deny-list alone doesn't block the IP behind the name. "The global_deny_list will only block specific hostnames, not entire destinations." (Usage, warning)

## Visuals worth redrawing

None.

## My notes

- The README doesn't spell out how it avoids a second DNS lookup between
  the check and the connect; as a CONNECT proxy it resolves and dials
  itself, but the article only claims what the README says.
