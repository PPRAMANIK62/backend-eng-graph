---
id: oidc
title: OpenID Connect
depth: short
phase: 15
note: >-
  Logging in with OAuth2: the ID token.
needs: [oauth2, jwt]
leads_to: []
compare_with: [sessions]
---


# OpenID Connect

OpenID Connect (OIDC) adds login to [[oauth2|OAuth 2.0]]. It's a thin
identity layer: the app runs the
normal OAuth code flow, asks for one extra scope, `openid`, and gets
back an **ID token** alongside the access token. The ID token tells the
app who logged in, where, and for whom, in a form it can check.

## Why OAuth alone doesn't log anyone in

An OAuth access token answers "may this app read these photos?". It's
addressed to an API, and to the app it's usually an opaque string. It
doesn't say which user approved it, or whether they logged in just now or
last month. Treating "I got an access token"
as "this user logged in" is how login bugs happen.

OIDC adds the missing piece: a token that's addressed to the app
itself and is about the login.

## The ID token

The ID token is a [[jwt|JWT]] signed by the identity provider (OIDC
calls it the OpenID provider). Its claims say:

- **`iss`**: who issued it, as an https URL.
- **`sub`**: the user's ID at that issuer. It's never reassigned to
  someone else.
- **`aud`**: who it's for. It must include your app's `client_id`.
- **`exp`** and **`iat`**: when it expires and when it was issued.
- **`nonce`**: a random value your app sent in the login request, copied
  back unchanged.
- **`auth_time`**: when the user actually authenticated, when you ask
  for it.

Your app has to check it before trusting any of it:

![An ID token payload with iss, sub, aud, exp, iat, nonce and auth_time claims, plus a signature. Arrows show what the client checks: iss equals the expected issuer exactly, aud contains the client's own client_id, exp is still in the future, nonce matches the one the client sent, and the signature is valid with keys from the provider's jwks_uri. iss plus sub together are the stable user ID.](img/oidc-id-token-checks.svg)

*The checks a client runs on an ID token. Adapted from Nat Sakimura et al., "OpenID Connect Core 1.0", sections 2 and 3.1.3.7. Most example values come from the spec's sample ID token in section 2.*

- **Issuer.** `iss` must exactly equal the provider you expect.
- **Audience.** `aud` must contain your `client_id`. A token minted for
  another app must be rejected, or any app the user ever logged into
  could replay its token to you.
- **Expiry.** The current time must be before `exp`.
- **Nonce.** It must equal the one you sent, which ties the token to
  this login attempt and stops replays.
- **Signature.** Checked with the provider's published keys. In the
  code flow the token comes straight from the token endpoint over
  [[tls|TLS]], and the spec lets the TLS server check stand in for the
  signature check.

Where do the keys come from? The provider publishes a JSON document at
`/.well-known/openid-configuration` under its issuer URL. It lists the
endpoints and a `jwks_uri`, where the signing keys live. The `issuer`
in that document must be identical to the `iss` in its tokens.

Once the ID token checks out, the pair **`iss` + `sub`** is your user's
identity. Store that as the link between your account and theirs. If
the app needs more profile data, it can call the provider's UserInfo
endpoint with the access token.

## Where it gets tricky

**Don't key accounts on email.** OIDC can return an `email` claim, but
the spec says not to rely on it being unique, and only `iss` plus `sub`
is guaranteed stable; other claims carry no such promise. If you link accounts by email, check `email_verified` and
understand what it means for that provider: the spec leaves how an
address is verified to the provider.

**The ID token isn't an API credential.** It's addressed to your app,
not to an API. To call APIs, use the access token. Sending ID tokens to
your backend services as if they were access tokens mixes up who each
token is for.

**The ID token isn't your session.** Its `exp` has nothing to do with
how long the user stays logged in to your app, or to the provider.
After you check it, start your own [[sessions|session]].

**Use the code flow.** OIDC also defines implicit and hybrid flows that
return tokens through the browser. The code flow returns every token
from the token endpoint, so none of them pass through the browser.
The [[oauth2]] article covers why that matters.

## What this means when you build

- Use a maintained OIDC library and the authorization code flow with
  PKCE.
- Send a fresh `nonce` and `state` per login and check them.
- Validate `iss`, `aud`, `exp`, `nonce` and the signature every time.
- Identify users by `iss` + `sub`, never by email alone.
- Fetch keys from the discovery document's `jwks_uri` rather than
  hard-coding them.
- After login, create your own session; don't reuse the ID token as
  one.

## Further reading

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), Nat Sakimura, John Bradley, Michael B. Jones, Breno de Medeiros, Chuck Mortimore, OpenID Foundation (errata set 2). The ID token, its claims, and the exact validation steps.
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html), Nat Sakimura, John Bradley, Michael B. Jones, Edmund Jay, OpenID Foundation (errata set 2). The well-known configuration document and `jwks_uri`.
