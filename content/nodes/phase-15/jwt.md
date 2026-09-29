---
id: jwt
title: JSON Web Tokens
depth: deep
phase: 15
note: >-
  Signed tokens a server can check without a lookup, and the classic
  mistakes.
needs: [hmac, public-key-crypto]
leads_to: [oidc]
compare_with: [sessions, api-keys, ssrf]
---


# JSON Web Tokens

A JSON Web Token (JWT, said "jot") is a small JSON object of claims,
like "this is user 42, valid until 10:15", with a signature attached.
Any service holding the right key can check the signature and trust the
claims without calling a database or the service that issued it. That's
why JWTs show up as [[oauth2|OAuth]] access tokens, [[oidc|OpenID Connect]] ID tokens and
service-to-service credentials. They're also easy to get wrong, and the
classic mistakes let anyone forge a token.

## What's inside one

A signed JWT is three base64url strings joined by dots:
`header.payload.signature`.

![A JWT split into three parts. The header decodes to {"alg":"HS256","typ":"JWT"}, the payload to {"loggedInAs":"admin","iat":1422779638}, and the signature is HMAC-SHA256 computed with the server's secret key over the encoded header, a dot, and the encoded payload. A note says the first two parts are only encoded, so anyone can read them.](img/jwt-anatomy.svg)

*The parts of a signed JWT. Example token and key ("secretkey") from Tim McLean, "Critical vulnerabilities in JSON Web Token libraries" (2015).*

- The **header** says how it's signed: `alg` is the algorithm, like
  `HS256` (HMAC with SHA-256) or `RS256` (an RSA signature).
- The **payload** is the claims. Some have registered names:
  - `iss`: who issued it.
  - `sub`: who it's about, usually a user ID.
  - `aud`: who it's meant for. A service that isn't in `aud` must
    reject it.
  - `exp`: when it expires. `nbf`: not valid before. Checkers may allow
    a few minutes of leeway for clock skew.
  - `iat`: when it was issued. `jti`: a unique ID, useful to stop
    replays.

  All of them are optional in the spec; your application decides which
  it requires.
- The **signature** covers the first two parts, exactly as encoded.

Base64url is an encoding, not encryption. Anyone holding the token can
read every claim. A signed JWT gives integrity, not secrecy, so don't
put anything in it you wouldn't show the user. (Encrypted JWTs exist,
as JWE, but they're a different beast.)

## Two ways to sign

The `alg` decides who can make tokens and who can check them.

**With a shared secret, HMAC (`HS256`).** The issuer and every checker
hold the same key; the "signature" is an [[hmac|HMAC]]. Simple and
fast, but anyone who can verify can also mint tokens. Fine inside one
service; risky when many services check tokens. The key must be long
and random. A human-memorable password as an HS256 key can be
brute-forced offline from a single captured token.

**With a key pair (`RS256`, `ES256`).** The issuer signs with a
private key; checkers verify with the [[public-key-crypto|public key]],
which can be published. Only the issuer can mint. This is what identity
providers use: an OIDC provider publishes its public keys at a URL
listed in its metadata, and your service fetches them.

## Checking a token, step by step

When a request arrives with `Authorization: Bearer <token>`:

1. **Check it's shaped like a JWT.** Only base64url characters and
   two dots. Anything else, reject.
2. **Decide the algorithm yourself.** Your code knows which algorithm
   and key it expects from this issuer. Look up the key (by `kid` if
   there are several), and verify with that key and that algorithm
   only. Don't let the token's header choose.
3. **Verify the signature.** Fail means reject, no exceptions.
4. **Check the claims.** `iss` is the issuer you trust, and the key
   belongs to it. `aud` includes you. `exp` is in the future and `nbf`
   in the past, with small leeway. If one issuer makes several kinds of
   token, check the type too (`typ`), so an ID token can't be used as
   an access token.
5. **Only now trust `sub` and the rest.**

Every step is there because someone skipped it.

## The classic mistakes

**`alg: none`.** The JWT specs define an algorithm called `none`, with
an empty signature, meant for when something else already protects
the token. Some libraries, handed a token with `"alg":"none"`, treated
it as verified. An attacker could write any payload, like
`"loggedInAs":"admin"`, and get in.

**RSA to HMAC confusion.** A server expects RS256 tokens and verifies
with its RSA public key. The attacker sends a token with
`"alg":"HS256"`, signed with HMAC using the server's *public key* as
the secret. A library that trusts the header runs HMAC with the key it
was given, which is that same public key, and the signature matches.
The public key is public, so anyone can forge tokens.

Both bugs, found by Tim McLean in 2015 across several libraries, have
one root: the token picked how it would be checked, before anyone had
checked it. The fix is the rule in step 2: allow a fixed set of
algorithms, and tie each key to exactly one algorithm.

**Blocklists instead of allowlists.** Some code rejected `none` by
string match, but parsed the algorithm case-insensitively. `"noNE"`
walked through. List what you accept, never what you reject.

**Trusting claims that drive lookups.** `kid` is used to look up a
key, often in a database, so it can carry [[sql-injection]]. The `jku`
and `x5u` headers name URLs to fetch keys from; follow them blindly and
an attacker can point your server at internal addresses, which is
[[ssrf]]. Treat every claim as attacker input until the signature is
verified, and even then only follow URLs you've allowlisted.

**Substitution.** A token issued for service A is replayed at service B,
which shares the issuer and skips the `aud` check. Or an ID token is
accepted where an access token was expected. Check the audience and the
type.

## JWTs as sessions

A popular idea: skip the session table, put the user ID and an expiry
in a JWT, and have every server verify it locally. No lookup, no shared
store.

The trouble is logging out. A JWT stays valid until `exp`, whatever
happens: the user logs out, changes their password, gets fired, or has
the token stolen. To revoke one early you need a deny list of revoked
token IDs that every server checks on every request. That's a shared
store with a lookup per request again, the thing you wanted to avoid.

The usual mitigation is a short lifetime, which bounds how long a
stolen or revoked token keeps working. For an ordinary web app talking
to its own backend, plain [[sessions]] with an opaque ID do the job with
less machinery. JWTs make most sense when the service checking the
token is not the one that issued it.

For program-to-program access that isn't on behalf of a user, compare
[[api-keys]], which are looked up rather than self-checking.

## Where it gets tricky

**The spec is flexible, and flexibility is attack surface.** The `alg`
header exists for agility, so systems can move to new algorithms. It's
also exactly what the classic attacks abused. The best-practice RFC
(RFC 8725, 2020) exists because of widely published attacks on
implementations. An update, draft-ietf-oauth-rfc8725bis, was in the
RFC Editor's queue when this was written and adds newer attacks: the
`noNE` blocklist bypass, compression bombs in encrypted tokens, huge
key-derivation counts that burn CPU, and confusion between the compact
format and the JSON format of the same signature.

**Deny lists have their own trap.** Keying a deny list on the raw token
or its hash looks natural, but some signatures are malleable: an
attacker can produce a different string that still verifies. Key it on
the issuer and `jti` instead.

**Clocks.** `exp` and `nbf` depend on the checker's clock agreeing with
the issuer's. Allow small leeway, not hours, and see [[clock-skew]].

**Where the browser keeps it.** A JWT in `localStorage` can be read by
any script on the page. If a browser holds it at all, an `HttpOnly`
[[cookies|cookie]] is the safer place, and then you're close to a
session cookie anyway.

## What this means when you build

- Use a maintained library, and configure it with the exact algorithms
  and keys you accept. Never let the header choose.
- Validate `iss`, `aud`, `exp` and `nbf` every time. Check `typ` when an
  issuer makes more than one kind of token.
- Prefer public-key signatures when more than one service verifies.
  HMAC keys must be long and random, never a password.
- Put nothing secret in the payload.
- Keep access tokens short-lived and have a revocation story before you
  need one.
- For a browser session with your own backend, reach for server-side
  sessions first.

## Further reading

- [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Jones, Bradley, Sakimura, 2015. The JWT spec: structure, the registered claims, and a worked HS256 example.
- [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725), Sheffer, Hardt, Jones, 2020. JWT best current practices: the known attacks and the checks that stop them.
- [JSON Web Token Best Current Practices (draft-ietf-oauth-rfc8725bis-10)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-rfc8725bis-10), Sheffer, Hardt, Jones, IETF. The update to RFC 8725, with attacks found since.
- [Critical vulnerabilities in JSON Web Token libraries](https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/), Tim McLean, 2015. The original write-up of the `none` and RSA/HMAC bugs, with a clear walk through a token.
- [JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html), OWASP. Signatures vs MACs, revocation and deny lists, and why JWTs make awkward sessions.
- [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), OWASP. Why tokens, JWTs included, don't belong in `localStorage`.
