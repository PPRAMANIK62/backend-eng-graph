---
id: sessions
title: Sessions
depth: deep
phase: 15
note: >-
  A random ID in a cookie, and the session stored on the server.
needs: [cookies]
leads_to: [csrf, passkeys]
compare_with: [jwt, oidc]
---


# Sessions

A user types their password once, and for the next hour every page
knows who they are. That's a session: after login the server hands the
browser a long random ID in a cookie, keeps what the ID means (which
user, when they logged in, what they're allowed to do) in its own store,
and looks it up on every request. The server stays in control: it can end
any session at any moment.

## From login to logged in

Walk through one login.

1. The browser sends a username and password over [[tls|TLS]]. The server
   checks the password against its [[password-hashing|stored hash]].
2. The server generates a **session ID**: at least 64 bits from a
   cryptographically secure random generator. If you make your own, use
   128 bits.
3. It stores a record under that ID: user ID, when the session started,
   when it was last used, maybe the login method. The record lives
   server side, in a table, a cache or both.
4. It sends the ID in a [[cookies|cookie]]:
   `Set-Cookie: __Host-sid=<id>; Secure; HttpOnly; SameSite=Lax; Path=/`.
5. On every later request the browser sends the cookie back. The server
   looks up the ID, finds the record, checks it hasn't expired, and
   knows who's calling.

Logging out deletes the record. The cookie in the browser may still
exist, but it now points at nothing.

![Sequence diagram between browser, API server and session store. Login: the browser posts username and password; the server checks the password hash, creates a random ID, writes the record with user ID and times to the store, and replies with Set-Cookie holding only the ID. Later request: the browser sends the cookie, the server looks up the ID in the store, gets the user, and answers. Logout: the server deletes the record, so the same cookie no longer matches anything.](img/sessions-lifecycle.svg)

*A server-side session. The cookie carries only a random ID; everything it means stays in the session store.*

## Why a random ID and not the data itself

You could put the user ID straight in the cookie. Anyone can edit a
cookie, so you'd have to sign it, and then you'd have a signed token
(that's the [[jwt]] approach). A random ID that means nothing on its own
has some quiet advantages:

- **Stealing it gets you less.** The ID is only useful against your
  server, and it holds no personal data to leak.
- **It can't be spliced.** With one ID, an attacker can't mix pieces of
  cookie content from two different logins to confuse the server.
- **The server decides.** Revoking a session is deleting a row. Nothing
  sent to the client needs to expire on its own.

The ID has to be unguessable. With 64 bits of entropy, an attacker
making 10,000 guesses a second against a site with 100,000 live
sessions would need about 585 years to hit one. Guessing isn't
the risk. Theft is.

While a session is active, its ID is as good as the password that
created it. Treat it that way.

## Where to keep the sessions

The session store is a real design choice, and a web framework's
options show the trade-offs clearly. Django, for example, offers:

| Store | Good | Watch out |
|---|---|---|
| Database (the default) | Durable, survives restarts | A query on every request; expired rows pile up until you run a cleanup job |
| Cache only (Redis, Memcached) | Fast | Eviction or a cache restart logs users out |
| Cache in front of the database | Fast reads, durable writes | Two systems to run |
| Signed cookie (no server store) | No lookups at all | Readable by the client, can outgrow the 4096-byte cookie limit, and can't be revoked |

The last row is the odd one out: it isn't a server-side session at
all. It's the same trade as a JWT. Logging out doesn't invalidate a
signed-cookie session; a stolen copy keeps working until it expires.

## Keeping sessions safe

**Change the ID at login.** If an attacker can plant a session ID in
your browser before you log in (through a subdomain they control, a URL
parameter, or an injected cookie), and the server keeps that ID after
login, the attacker now shares your logged-in session. That's
**session fixation**. The fix is to issue a fresh ID whenever privilege
changes: at login, on password change, when switching to an admin role.
Frameworks do this for you (Django's login calls `cycle_key()`), and
the server should never accept an ID it didn't generate.

**Only accept the ID from the cookie.** IDs in URLs end up in logs,
browser history, bookmarks and `Referer` headers. Django, for one,
refuses to put them there at all.

**HTTPS for the whole session,** not just the login page, and the
`Secure` flag on the cookie so it never goes out over plain HTTP.

**Keep it out of JavaScript's reach.** `HttpOnly` on the cookie, and
never copy the ID into `localStorage`, where any script on the page can
read it.

**Don't cache responses that set it.** Send `Cache-Control: no-store`
on responses carrying the session cookie.

**Protect state changes from CSRF.** Because the browser sends the
cookie automatically, another site can make a logged-in user's browser
send requests. `SameSite` helps; real [[csrf]] protection finishes the
job.

## How sessions end

Sessions need two clocks, both enforced on the server:

- **Idle timeout**: end the session after a stretch without requests.
- **Absolute timeout**: end it a fixed time after login, however busy
  it is.

The idle timeout alone isn't enough. An attacker holding a stolen
session can keep it alive by making a request now and then. The
absolute timeout caps how long a stolen session lasts.

For numbers: NIST's guideline for its middle assurance level (AAL2)
is at most 24 hours overall and 1 hour idle. At the highest level
(AAL3) it's 12 hours and 15 minutes. Common idle timeouts run 2 to 5
minutes for high-value apps and 15 to 30 minutes for low-risk ones.

Cookie expiry is not a timeout. A browser can be told to keep the
cookie longer, or an attacker can replay a copy. The server's record is
what decides.

Some apps also rotate the ID partway through a long session, which
shortens the life of any single stolen ID. And after risky events
(password change, login from a new device) ask the user to log in
again.

## Where it gets tricky

**"Stateless" is tempting and costly.** Keeping sessions on the server
means a lookup per request and a store to run. Signed tokens avoid that,
and it's the most common reason people reach for JWTs as sessions. But
the first time you need "log out everywhere" or "revoke this stolen
session", you need server state again, usually a deny list checked on
every request. Server-side sessions are the plain answer that already does
revocation.

**The session store is on the hot path.** Every authenticated request
reads it. A cache in front of a database is the common answer. A
cache-only store is faster still, but a flush or restart logs everyone
out.

**Subdomains are part of your attack surface.** Any subdomain can set
cookies for the parent domain. A session cookie without the `__Host-`
prefix can be overwritten or fixed by a less trusted app on a sibling
subdomain.

**Bearer tokens can be copied.** A session cookie works for whoever
holds it. Newer designs bind the session to a key on the device so a
copied cookie alone isn't enough. The Device Bound Session Credentials
spec is one such design, still emerging.

**Many devices.** A user has several sessions at once. Store them so
you can list and revoke them per user, not only per ID.

## What this means when you build

- Use your framework's session code. Configure it; don't write your own
  ID generator.
- Cookie: `__Host-` name, `Secure`, `HttpOnly`, `SameSite=Lax` or
  `Strict`, opaque ID only.
- New ID at login and at every privilege change.
- Idle and absolute timeouts, enforced by the server, and logout that
  deletes the server record.
- Index sessions by user so "log out all devices" is one query.
- Pick the store for your traffic: database for durability, a cache in
  front for speed, and know what a cache restart does to your users.

## Further reading

- [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), OWASP. ID entropy, cookie attributes, fixation, the three kinds of timeout, and logout.
- [Cookies: HTTP State Management Mechanism (draft-ietf-httpbis-rfc6265bis-22)](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis-22), Mike West and John Wilander (editors), IETF. Section 8.4: why a random session ID beats data in the cookie, and how fixation works.
- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), NIST, 2025. Section 5, session management: secret size, cookie rules, and timeout limits per assurance level.
- [JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html), OWASP. Why a JWT used as a session needs a deny list, and so server state, to support logout.
- [How to use sessions](https://docs.djangoproject.com/en/6.1/topics/http/sessions/), Django 6.1 docs. A real framework's session stores and the honest trade-offs of each, including signed cookies.
