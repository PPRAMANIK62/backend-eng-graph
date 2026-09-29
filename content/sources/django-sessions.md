---
id: django-sessions
title: How to use sessions (Django 6.1 documentation)
author: Django Software Foundation
url: https://docs.djangoproject.com/en/6.1/topics/http/sessions/
kind: docs
primary: true
---

## Summary

Django's session framework (docs for Django 6.1): a cookie carries the
session ID, and the data lives in a pluggable store (database by
default, or cache, cache plus database, files, or a signed cookie). The
page is frank about each store's trade-offs, especially signed-cookie
sessions.

## Key claims

- Data on the server, ID in the cookie. "Cookies contain a session ID – not the data itself (unless you’re using the cookie based backend)." (intro)
- Default store is the database. "By default, Django stores sessions in your database (using the model django.contrib.sessions.models.Session)." (Configuring the session engine)
- cached_db is write-through. "The cached database backend (cached_db) uses a write-through cache – session writes are applied to both the database and cache, in that order." (Using cached sessions)
- Cache-only sessions log people out on eviction. "Eviction can occur if the cache fills up or the cache server is restarted, and it will mean session data is lost, including logging out users." (Using cached sessions)
- Signed-cookie sessions are readable by the client. "When using the cookies backend the session data can be read by the client." (Using cookie-based sessions)
- They can outgrow a cookie. "Even though Django compresses the data, it’s still entirely possible to exceed the common limit of 4096 bytes per cookie." (Using cookie-based sessions)
- No freshness. "it cannot guarantee freshness i.e. that you are being sent back the last thing you sent to the client." (Using cookie-based sessions)
- Not invalidated at logout. "Unlike other session backends which keep a server-side record of each session and invalidate it when a user logs out, cookie-based sessions are not invalidated when a user logs out." (Using cookie-based sessions)
- A stolen signed-cookie session outlives logout. "Thus if an attacker steals a user’s cookie, they can use that cookie to login as that user even if the user logs out." (Using cookie-based sessions)
- Login rotates the key. "django.contrib.auth.login() calls this method to mitigate against session fixation." (cycle_key)
- Expired rows pile up until purged. "Django does not provide automatic purging of expired sessions. Therefore, it’s your job to purge expired sessions on a regular basis." (Clearing the session store)
- Subdomains can fix sessions. "Subdomains within a site are able to set cookies on the client for the whole domain. This makes session fixation possible if cookies are permitted from subdomains not controlled by trusted users." (Session security)
- No IDs in URLs, by design. "It does not fall back to putting session IDs in URLs as a last resort, as PHP does." (Session IDs in URLs)

## Visuals worth redrawing

None.

## My notes

- Good concrete picture of the storage choice a backend makes: database
  (durable, one query per request), cache (fast, lost on eviction),
  both (write-through), or no server state at all (signed cookie).
