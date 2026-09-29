---
id: oauth2
title: OAuth 2.0
depth: deep
phase: 15
note: >-
  Letting an app act for a user without their password. The auth code
  flow with PKCE.
needs: [tls]
leads_to: [oidc, sender-constrained-tokens]
compare_with: [csrf]
---

# OAuth 2.0

OAuth 2.0 lets one app act on a user's behalf at another service
without ever seeing the user's password. The user approves the app at
the service's own login page, and the app gets back an access token:
a credential limited to certain actions and a certain lifetime. You'll
meet it whenever your app calls someone else's API for a user, and
whenever you run an API that other apps want to call for your users.

## The problem: handing over your password

Say you want a photo printing site to print the photos you keep on a
photo sharing site. Before OAuth, the printing site would ask for your
photo site username and password and log in as you. That's bad in
several ways at once:

- The printing site has to store your password, often in plain text.
- It can do anything you can do: delete photos, change settings, read
  messages. There's no way to give it "read my photos" and nothing
  more.
- You can't cut off just the printing site. The only way to revoke it
  is to change your password, which cuts off every other app too.
- If the printing site is breached, your password is out, and with it
  everything behind that password.

OAuth fixes this by giving the printing site a different credential
from yours. It sends you to the photo site, you log in there, you
approve a limited request, and the printing site gets an **access
token** for exactly that request. The printing site never sees your
password.

## Four roles

OAuth names four parties. In the photo example:

- **Resource owner**: you, the user who can grant access.
- **Client**: the printing site, the app that wants access. "Client"
  says nothing about where it runs; it can be a web backend, a mobile
  app or a script.
- **Authorization server**: the part of the photo site that logs you
  in, asks for your consent and hands out tokens.
- **Resource server**: the photo site's API that holds the photos and
  accepts tokens.

The authorization server and the resource server can be one program or
two. One authorization server can issue tokens for many APIs.

## The authorization code flow

The flow you should use for almost everything is the authorization
code flow with PKCE (pronounced "pixy"). Here it is end to end:

![Sequence diagram with four lanes: user's browser, client, authorization server and resource server. The client makes a random code_verifier and keeps it, then redirects the browser to the authorization server's /authorize endpoint with client_id, redirect_uri, scope, state and a code_challenge that is the SHA-256 of the verifier. The user signs in and approves. The authorization server redirects the browser back to the client's redirect_uri with a code and the state. The client then posts the code and the code_verifier straight to the /token endpoint; the server checks that the SHA-256 of the verifier matches the challenge and returns an access token and optionally a refresh token. The client calls the API with an Authorization: Bearer header. The first half runs through the browser (front channel); the second half is direct over TLS (back channel).](img/oauth2-code-flow-pkce.svg)

*The authorization code flow with PKCE. Adapted from Dick Hardt (editor), RFC 6749, "The OAuth 2.0 Authorization Framework", figure 3 (2012), and Nat Sakimura (editor) et al., RFC 7636 (2015).*

1. **The client sends the browser to the authorization server.** It
   redirects the user to the `/authorize` endpoint with its
   `client_id`, the `redirect_uri` to come back to, the `scope` it
   wants (say, read photos), a random `state`, and a PKCE
   `code_challenge` (next section).
2. **The user logs in and approves.** This happens on the
   authorization server's own page. The client isn't involved; it never
   sees the password, a second factor or a passkey.
3. **The authorization server sends the browser back** to the
   `redirect_uri` with a short-lived **authorization code** in the
   query string, plus the same `state`.
4. **The client swaps the code for tokens.** Its backend makes a direct
   POST to the `/token` endpoint with the code (and its own client
   credentials, if it has any). The server checks everything and
   returns an access token, and maybe a refresh token.
5. **The client calls the API** with the access token in a header:
   `Authorization: Bearer <token>`.

Why the detour through a code, instead of handing out the token in
step 3? Everything in steps 1 to 3 travels through the browser, as
redirects, and URLs end up in browser history and in `Referer` headers. The
code is only useful to someone who can also finish step 4, it expires
fast (the spec recommends at most 10 minutes), and it works once. If a
code is presented twice, the server must refuse, and should revoke any
tokens it already issued from it. The real token only ever moves on the
direct connection between the client and the authorization server.

Every one of these endpoints must run over [[tls|TLS]]. The spec
requires it at the authorization and token endpoints, because
passwords, codes and tokens all cross them in the clear otherwise, and
the current security guidance forbids sending authorization responses
over unencrypted connections at all.

## PKCE: proving you're the one who started

The code flow as first written had a hole. A mobile app can't keep a
client secret, because the secret would ship inside every copy of the
app. RFC 6749 calls
these **public clients**, as opposed to **confidential clients** like a
web backend that can keep a secret on a server. A public client can't
prove who it is at step 4, so anyone holding its code could redeem it.

And codes do get stolen. On a phone, the redirect back to an app often
uses a custom URL scheme like `com.example.app://callback`. A malicious
app can register the same scheme, receive the code, and redeem it
first.

PKCE (RFC 7636, 2015) closes the hole with a per-request secret:

1. Before step 1, the client generates a **code verifier**: a random
   string of 43 to 128 characters. The recommended way is 32 random
   bytes, base64url-encoded, which gives 43 characters.
2. It sends only the **code challenge** in step 1: the base64url of the
   verifier's SHA-256 hash (the `S256` method). A
   [[cryptographic-hashes|hash]] can't be run backwards, so seeing the
   challenge doesn't reveal the verifier.
3. In step 4 it sends the verifier itself. The server hashes it and
   checks that it matches the challenge it stored with the code.

A thief who grabs the code in step 3 doesn't have the verifier, which
never left the client. The code is useless to them.

PKCE was designed for mobile apps, but the current best practice,
RFC 9700 (2025), extends it to every client: public clients must use
it, confidential clients should, and authorization servers must
support it. It also protects against a second attack: an attacker
injecting their own code into your callback so you end up linked to
their account. That's a [[csrf|cross-site request forgery]] against
the redirect, which the `state` parameter is there to stop. If the
authorization server supports PKCE, a client may rely on PKCE for this
instead.

The older `plain` method, where the challenge is just the verifier,
is allowed only for clients that can't do `S256` for some technical
reason. Clients that can do
`S256` must use it, and must not fall back to `plain` after trying it.

## Access tokens and refresh tokens

OAuth doesn't say what an access token looks like. To the client it's
usually an opaque string. On the server side it's either an ID the
resource server looks up, or a self-contained signed token the
resource server can check without a lookup, often a [[jwt|JWT]].

Either way, a plain OAuth access token is a **bearer token**: whoever
holds it can use it, with no key to prove. That's why tokens go in the
`Authorization` header, not in URLs, which get logged and stored in
browser history.

Because a leaked token is a usable token, the current advice limits
what each token can do:

- **Least privilege.** A token should carry only the scope the app
  needs.
- **Audience restriction.** A token should be meant for one API, or a
  small set, and each API should refuse tokens meant for someone else.
- **[[sender-constrained-tokens|Sender-constrained tokens]].** Bind the
  token to a key the client holds, with [[mtls|mutual TLS]] or DPoP
  (Demonstrating Proof of Possession), so a stolen token alone isn't
  enough.

Access tokens expire. For long access, the
authorization server can also issue a **refresh token**, which the
client trades for a new access token when the old one expires. A
refresh token only ever goes to the authorization server, never to an
API.

A refresh token held by a public client is a juicy target, so RFC 9700
requires one of two protections. Either it's sender-constrained, or
it's **rotated**: every refresh returns a new refresh token and
invalidates the old one. If an attacker steals one and both the
attacker and the real client use it, one of them will present a token
that's already been used. The server can't tell which one is the
thief, so it revokes the active refresh token, and the real client has
to go through the authorization flow again.

## Grants that have been cut

RFC 6749 defined more ways to get a token than the code flow. Two of
them are now deprecated:

- **The implicit grant** returned the access token directly in the
  redirect URL, meant for browser apps that had no backend. The token
  sat in the front channel where it could leak or be injected, and
  there's no way to sender-constrain it. RFC 9700 says not to use it.
- **The password grant** had the app collect the user's password and
  send it to the token endpoint. That's the exact problem OAuth was
  created to remove. It also trains users to type passwords into
  places other than the real login page. It wasn't designed for
  [[mfa|second factors]] or multi-step logins, and [[passkeys]] may be
  impossible with it, since they're tied to the real login page's web
  origin. RFC 9700 says it must not be used.

The **client credentials** grant, where a service gets a token for
itself with no user involved, stays in the OAuth 2.1 draft. So does the code flow, which is
now the answer for web apps, single-page apps and mobile apps alike.

## Where it gets tricky

**OAuth is about authorization, not login.** An access token says "this
app may read these photos". It doesn't tell the client who the user is,
and to the client it's usually an opaque string anyway. Using "we got a
token" as "the user logged in" is a classic bug. Logging in with OAuth
is what [[oidc|OpenID Connect]] adds, with a separate ID token meant
for the client.

**The redirect URI is the whole game.** The code is delivered wherever
the redirect URI points. If an authorization server accepts loose
matches (any path under a domain, a wildcard subdomain), an attacker
can craft a request that sends the code to a page they control. RFC
9700 requires exact string matching, with one exception for the port of
a loopback redirect used by desktop apps. An open redirector anywhere
on the client's site, a page that forwards to any URL in a query
parameter, is enough to leak codes too.

**Mobile apps and web views.** An app that shows the login page inside
its own embedded web view can read what the user types there, which
defeats the point of OAuth. RFC 8252 (2017) says native apps must do
the authorization in the system browser instead. That also gives the
user single sign-on, since they're often already logged in there.

**OAuth 2.0 is a stack of documents.** RFC 6749 and RFC 6750 (bearer
tokens) are from 2012. PKCE, the native app rules and the security
guidance came later as separate RFCs, and RFC 9700 changed several of
the original defaults, so older write-ups can show flows that are now
deprecated. The OAuth 2.1 draft folds all of it into one document: PKCE
required in the code flow, exact redirect matching, no implicit grant,
no password grant, no `plain` PKCE, no tokens in query strings. When
this was written it was still an Internet-Draft (revision -16), not an
RFC.

**It's a framework, not a protocol.** RFC 6749 leaves the token
format, how the API checks a token, and how the authorization server
and the API talk to each other to other specs or to you, so two OAuth
deployments can differ a lot. Publishing authorization server metadata
lets client libraries configure themselves instead of guessing.

## What this means when you build

- Use the authorization code flow with PKCE (`S256`) for every kind of
  client, including server-side web apps.
- Register exact redirect URIs, and don't run open redirects anywhere
  on your site.
- Send `state`, or rely on PKCE for CSRF protection only when you know
  the server enforces it.
- Keep tokens out of URLs and logs. Ask for the narrowest scope, and on
  the API side, check each token's audience and scope on every
  request.
- Rotate refresh tokens for mobile and browser clients, or bind them to
  a key.
- If you need to know who the user is, use OpenID Connect, not the
  access token.
- In native apps, open the system browser, never a web view.
- Use a maintained OAuth library; the details are where the attacks
  are.

## Further reading

- [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), Dick Hardt (editor), IETF, 2012. The OAuth 2.0 framework: roles, client types, the code flow, refresh tokens.
- [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), Nat Sakimura (editor), John Bradley, Naveen Agarwal, IETF, 2015. PKCE: the code interception attack and the verifier and challenge.
- [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700), Torsten Lodderstedt, John Bradley, Andrey Labunets, Daniel Fett, IETF, 2025. Current security best practice: what changed since 2012 and why.
- [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), Michael B. Jones, Dick Hardt, IETF, 2012. Bearer tokens and how to send them.
- [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252), William Denniss, John Bradley, IETF, 2017. OAuth in mobile and desktop apps: system browser, redirect options.
- [The OAuth 2.1 Authorization Framework](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/), Dick Hardt, Aaron Parecki, Torsten Lodderstedt, IETF draft -16. OAuth consolidated into one document, with a list of changes from 2.0.
