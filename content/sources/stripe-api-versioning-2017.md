---
id: stripe-api-versioning-2017
title: "APIs as infrastructure: future-proofing Stripe with versioning"
author: Brandur Leach (Stripe)
url: https://stripe.com/blog/api-versioning
kind: blog
primary: true
---

## Summary

How Stripe changed its API for years without breaking integrations:
rolling, date-named versions, each account pinned to the version of
its first request, a `Stripe-Version` header to override, and "version
change modules" that transform a current response backwards into older
shapes. Written in 2017.

## Key claims

- Once one user depends on an API, you lose the freedom to change it. "API developers lose that flexibility as soon as even one user starts consuming their interface." (intro)
- Stripe had kept every version working since 2011. "we’ve maintained compatibility with every version of our API since the company’s inception in 2011." (intro)
- Example of a breaking change: a `verified` boolean replaced by a `status` field. "If we later replaced the bank account’s verified boolean with a status field that might include the value verified (like we did back in 2014), the code will break because it depends on a field that no longer exists." (intro)
- Fields stay, with the same name and type. "Fields that were present before should stay present, and fields should always preserve their same type and name." (intro)
- Adding endpoints and fields is safe. "it’s safe to add a new API endpoint, or a new field to an existing API endpoint that was never present before." (intro)
- Major versions in the URL or Accept header are common. "This is often seen as a major versioning scheme with names like v1, v2, and v3 that are passed as a prefix to a URL (like /v1/widgets) or through an HTTP header like Accept." (API versioning schemes)
- Big major versions are nearly as painful as starting over. "changes between versions being so big and so impactful for users that it’s almost as painful as re-integrating from scratch." (API versioning schemes)
- Some users get stuck on old versions, and the provider must cut them off or pay forever. "there will be a class of users that are unwilling or unable to upgrade and get trapped on old API versions." (API versioning schemes)
- Stripe's versions are named by release date and each carries a small set of changes. "Although backwards-incompatible, each one contains a small set of changes that make incremental upgrades relatively easy" (API versioning schemes)
- The first request pins the account's version. "The first time a user makes an API request, their account is automatically pinned to the most recent version available" (API versioning schemes)
- A header overrides the version per request. "Users can override the version of any single request by manually setting the Stripe-Version header" (API versioning schemes)
- Almost a hundred breaking upgrades in six years without a new major version. "Our current approach has been sufficient for almost a hundred backwards-incompatible upgrades over the past six years." (API versioning schemes)
- Responses are built at the current version, then walked back through change modules to the target version. "It then walks back through time and applies each version change module that finds along the way until that target version is reached." (Versioning under the hood)
- Changes with side effects can't be isolated this way and are avoided. "This reduced encapsulation makes changes with side effects more complex to maintain, so we try to avoid them." (Changes with side effects)
- Versioning isn't free; they try to get the design right first, with an API review. "we do as much as we can to avoid using it by trying to get the design of our APIs right the first time." (Minimizing change)
- The target version comes from, in order: the header, the OAuth app's version, the account's pin. "The version of an authorized OAuth application if the request is made on the user’s behalf." (Versioning under the hood)
- Version change modules keep old versions out of the main code. "Version change modules keep older API versions abstracted out of core code paths." (Versioning under the hood)
- Each change module is written against how data looked when it was written. "Version changes are written so that they expect to be automatically applied backwards from the current API version and in order." (Versioning under the hood)

## Visuals worth redrawing

- The "API versioning" diagram: a response at the current version
  passing backwards through version change modules. Redrawn in
  api-versioning.

## My notes

- Author from the page's structured metadata (Brandur Leach).
- Stripe's docs now describe a newer release process (monthly
  non-breaking releases, two breaking major releases a year, starting
  with "acacia"). Not given a note; see the candidates list.
