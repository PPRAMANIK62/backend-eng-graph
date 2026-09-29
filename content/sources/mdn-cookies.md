---
id: mdn-cookies
title: Using HTTP cookies
author: MDN Web Docs contributors (Mozilla)
url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
kind: docs
primary: false
---

## Summary

MDN's guide to cookies: what they're for, the login flow with a session
cookie, how to set and remove them, the security attributes, SameSite
and third-party cookies, and privacy rules.

## Key claims

- What a cookie is. "A cookie (also known as a web cookie or browser cookie) is a small piece of data a server sends to a user's web browser." (intro)
- Session cookies in the login flow. "The browser sends the cookie containing the session ID along with the corresponding request to indicate that it still thinks the user is signed in." (intro, step 3)
- Regenerate on login. "If your site authenticates users, it should regenerate and resend session cookies, even ones that already exist, whenever a user authenticates." (note on session fixation)
- Values are visible to the user. "When you store information in cookies, by default all cookie values are visible to, and can be changed by, the end user." (Security)
- Secure, with a localhost exception. "It's never sent with unsecured HTTP (except on localhost, although this exception is not supported by Safari)" (Security, Secure)
- HttpOnly blocks JavaScript. "A cookie with the HttpOnly attribute can't be accessed by JavaScript, for example using Document.cookie; it can only be accessed when it reaches the server." (Security, HttpOnly)
- Path isn't a security boundary. "It is not intended as a security measure, and does not protect against unauthorized reading of the cookie from a different path." (Define where cookies are sent, note)
- Cross-site means a different registrable domain or scheme. "Cross-site requests are requests where the site (the registrable domain) and/or the scheme (http or https) do not match the site the user is currently visiting." (Controlling third-party cookies with SameSite)
- SameSite=None needs Secure. "Note that if SameSite=None is set then the Secure attribute must also be set — SameSite=None requires a secure context." (SameSite)
- The default when SameSite is missing. "If no SameSite attribute is set, the cookie is treated as Lax by default." (SameSite)
- HttpOnly only helps against XSS. "This precaution helps mitigate cross-site scripting ( XSS ) attacks." (Security, HttpOnly)
- Browsers block third-party cookies. "Browser vendors know that users don't like this behavior, and as a result have all started to block third-party cookies by default, or at least made plans to go in that direction." (Privacy and tracking)

## Visuals worth redrawing

None.

## My notes

- OWASP's session cheat sheet says the SameSite default "varies across
  browsers and versions"; MDN states one default. Treat it as not
  guaranteed and set SameSite explicitly.
