---
id: stripe-docs-versioning
title: "Stripe API reference: Versioning"
author: Stripe
url: https://docs.stripe.com/api/versioning
kind: docs
primary: true
---

## Summary

The versioning section of Stripe's API reference, read when this was
written (current version named "dahlia"). Since the "acacia" release in
2024, Stripe ships monthly versions with no breaking changes and two
major releases a year that may break. It also says which enums can grow.

## Key claims

- The new release process: monthly non-breaking versions, and a breaking major release twice a year. "Twice a year, we issue a new major release (for example, Basil) that starts with an API version containing breaking changes." (Versioning)
- Monthly versions are safe to adopt without code changes. "You can safely upgrade to any monthly release without updating your code." (Versioning)
- A major release can require code changes. "Upgrading to a new major release can require changes to your existing integration." (Versioning)
- Requests use the account's default version unless the Stripe-Version header overrides it. "Requests made with curl use your Stripe account’s default API version (controlled in Workbench) unless you override it by setting the Stripe-Version header." (Versioning)
- Webhook events also get a version, set per endpoint. "Webhook events also use your account’s default API version unless you set an API version during endpoint creation." (Versioning)
- Open enums can gain values without a version change. "Stripe can add new values as a backward-compatible change without requiring an API version upgrade." (Enums)
- So clients need a fallback branch for unknown enum values. "your code should include a safe fallback—such as a default branch in a switch statement—to gracefully handle values your integration doesn’t yet recognize." (Enums)
- The monthly-plus-major process started with the acacia release, in 2024 (the page names the release with its full date). "Stripe follows a new API release process where we release new API versions monthly with no breaking changes." (Versioning)
- The reference marks which enums are open. "Each enum’s reference entry indicates whether it is open." (Enums)

## Visuals worth redrawing

None.

## My notes

- The version strings themselves are dates plus a name; they're left
  out of these notes because this folder doesn't store calendar dates.
- Compare with the 2017 blog post (stripe-api-versioning-2017), which
  describes rolling date-named versions without the twice-yearly major
  releases.
