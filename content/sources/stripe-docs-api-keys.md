---
id: stripe-docs-api-keys
title: API keys, Stripe Docs
author: Stripe
url: https://docs.stripe.com/keys
kind: docs
primary: true
---

## Summary

Stripe's page on its API keys: publishable, secret, restricted and
organisation keys, their prefixes (including test vs live), restricted
keys with chosen permissions, show-once secrets, and rotation with an
overlap period.

## Key claims

- Prefixes mark key type and mode. "Sandbox keys start with pk _ test _ for publishable keys, rk _ test _ for restricted keys and sk _ test _ for secret keys." (Get started)
- Live keys have their own prefixes. "Switch to your live mode keys , which start with pk _ live _ , rk _ live _ , and sk _ live _ ." (Get started)
- Publishable keys are safe in front-end code and can't do sensitive operations. "it can’t perform sensitive operations such as creating charges or reading account data." (Key types)
- Restricted keys limit the damage of a leak. "Limit the damage to your business that a fraudulent actor could cause if they obtained your key." (Key types)
- Secret keys can't be limited, so Stripe discourages them for new uses. "Because you can’t limit their permissions, we don’t recommend using secret keys for new use cases" (Key types)
- A new secret key is shown once. "Save the key value. You can’t retrieve it later." (Create a secret API key)
- Rotation revokes the old key and makes a new one. "Rotating an API key revokes it and generates a replacement key that’s ready to use immediately." (Rotate an API key)
- Both keys work during a grace period of up to 7 days. "When you rotate a key in the Dashboard, both the old and new keys work for up to 7 days." (Rotate safely to avoid downtime)
- When to rotate: a lost key, a compromised key, or a team member leaving. "If a secret or restricted API key is compromised and you need to revoke it to block any potentially malicious API requests that might use the key." (Rotate an API key)
- Rotation can be scheduled. "You can also schedule an API key to rotate after a certain time." (Rotate an API key)
- Expired keys get an authentication error. "If a request includes an expired key, Stripe returns an authentication error ." (intro)

## Visuals worth redrawing

None.

## My notes

- The page doesn't say how Stripe stores keys; "can't retrieve it later"
  fits hashed storage but isn't a statement of it.
