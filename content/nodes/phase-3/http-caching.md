---
id: http-caching
title: HTTP caching
depth: deep
phase: 3
note: >-
  Cache-Control, validation with ETags, and shared vs private caches:
  how HTTP decides what may be stored and reused.
needs: [http-semantics]
leads_to: [cdn, conditional-requests]
compare_with: [caching, cache-stampede, cors]
---

# HTTP caching

HTTP caching is the set of rules that lets a browser, a proxy or a CDN
keep a copy of a response and hand it out again without asking your
server. Done right, repeat requests cost nothing and a changed file
costs one small round trip. Done wrong, users get week-old JavaScript,
or one user's account page gets served to the next.

The rules live in headers your server sends. They build on
[[http-semantics]] and are defined in RFC 9111 (2022): what may be
stored, how long it stays usable, and how a cache checks whether it
changed.

## One file, three requests

Say a browser fetches a stylesheet and your server answers:

```http
HTTP/1.1 200 OK
Content-Type: text/css
Cache-Control: max-age=3600
ETag: "v7"

body { ... }
```

`max-age=3600` says the response is **fresh** for an hour: reusable
without asking. `ETag: "v7"` is a **validator**, a label
for this exact version.

1. **Ten minutes later** the page needs the file again. The copy is
   fresh, so the browser uses it without any network traffic.
2. **Seventy minutes later** the copy is **stale**. The browser doesn't
   throw it away. It asks the server a conditional question,
   "send it only if it isn't still `v7`":

   ```http
   GET /app.css HTTP/1.1
   If-None-Match: "v7"
   ```

   Nothing changed, so the server answers `304 Not Modified` with
   headers and no body. The browser updates the stored headers and the
   copy is fresh for another hour.
3. **After a deploy** the same question gets a full `200 OK` with the
   new file and a new ETag, which replaces the stored copy.

![Sequence diagram between a browser with its cache and an origin server. First request: a miss, the origin returns 200 with max-age=3600 and ETag v7, the browser stores it. Ten minutes later: a fresh hit, no request leaves the browser. Seventy minutes later: the copy is stale, the browser sends a conditional GET with If-None-Match v7, the origin answers 304 with no body, and the copy is fresh again. A bar on the left shows the fresh hour and the stale period after it.](img/http-caching-fresh-stale-304.svg)

*One cached file over seventy minutes: a miss, a fresh hit, then a revalidation that costs no body.*

That's the whole model. **Freshness** decides whether a copy can be
used without asking, which saves the round trip. **Validation** checks
whether a stale copy is still good, which saves only the body.

## Private caches and shared caches

A **private cache** belongs to one user, usually the browser's. A
**shared cache** serves many users: a [[reverse-proxy]] in front of
your servers, a [[cdn|CDN]], or a proxy on the network path. Since
HTTPS has become common, proxies on the path mostly just tunnel
encrypted bytes and can't cache, so in practice the shared caches you
meet are the ones you or your CDN run.

A shared cache hands one stored response to everyone, so its rules
are stricter:

- It must not store a response marked `private`.
- It must not reuse a response to a request that carried an
  `Authorization` header, unless the response says `public`,
  `s-maxage` or `must-revalidate`.
- `s-maxage` gives it its own lifetime, overriding `max-age`.

## What may be stored

Reuse is the default when nothing forbids it, and the rules are mostly
about what a cache must *not* do. A cache may store a response only if:

- it understands the **method**. The spec defines caching for GET,
  HEAD and POST, but nearly every cache only does GET and HEAD. A POST
  response is cacheable only with an explicit lifetime and a
  `Content-Location` equal to the POST's URL, and can then only answer
  a later GET or HEAD;
- the status is final (not 1xx);
- there's no `no-store`, and for a shared cache, no `private`;
- and it carries some permission: `max-age`, `s-maxage`, `Expires`,
  `public`, `private` (for a private cache), an extension that allows
  it, or a **heuristically cacheable** status code. Those are 200, 203,
  204, 206, 300, 301, 308, 404, 405, 410, 414 and 501.

So a 200 or a 404 with no caching headers at all can still be stored,
with a lifetime the cache guesses.

## The Cache-Control directives

The response directives you'll actually use:

| Directive | What it means |
|---|---|
| `max-age=N` | Fresh until the response is N seconds old. |
| `s-maxage=N` | Same, for shared caches only, and overrides `max-age` there. Once stale, a shared cache must revalidate. |
| `no-cache` | May be stored, but must be revalidated with the origin before every reuse. |
| `no-store` | Must not be stored at all, by any cache. |
| `private` | Only a private cache may store it. |
| `public` | May be stored even where it otherwise couldn't, such as with `Authorization`. |
| `must-revalidate` | Once stale, never reuse it without revalidating, even if the origin is down (send an error, usually 504). |
| `immutable` | Won't change while fresh; don't revalidate it even on reload (RFC 8246, 2017). |

A few things the table hides:

- **`no-cache` doesn't mean "don't cache".** It means "always check".
  With a validator, a check costs a 304 and no body. `no-store` is the
  one that forbids storage.
- **`public` is rarely needed.** A response with `max-age` is already
  cacheable. `public` mostly matters for requests with
  `Authorization`, where it can leak a personalized response.
- **Neither `private` nor `no-store` is a privacy tool.** They say where
  a response may be stored. A broken or hostile cache can ignore them,
  and anyone watching the network can read a response sent without
  [[tls|TLS]].
- **`Expires` is the old way.** An absolute date, hard to parse and
  dependent on clocks. `max-age` overrides it, and an invalid value
  such as `0` counts as already expired.
- **You can't aim a directive at one cache.** Every cache on the path
  sees the same header. That's why CDNs got their own header,
  `CDN-Cache-Control` (RFC 9213); see [[cdn]].
- **Caches ignore directives they don't know,** which is how
  extensions like `immutable` deploy safely.

If directives conflict, such as `max-age` together with `no-cache`, the
cache should honour the most restrictive one.

## How long is fresh

A response is fresh while its **age** is less than its **freshness
lifetime**. The lifetime comes from the first rule that matches:

1. `s-maxage`, if the cache is shared;
2. `max-age`;
3. `Expires` minus the response's `Date`;
4. otherwise a **heuristic**, if the response is allowed one.

**Age** is the time since the origin generated or last validated the
response, including time spent in other caches on the way. A cache that
serves a stored response adds an `Age` header, so the next cache down
knows how much lifetime is left. If a CDN serves a response with
`max-age=604800` (one week) and `Age: 86400` (one day), the browser
treats it as fresh for the remaining 518,400 seconds, not a full week.

**Heuristic freshness** is the cache's guess when the server gives no
lifetime. The spec doesn't fix an algorithm. It suggests a fraction of
the time since `Last-Modified`, with 10% as a typical setting. So a file
last changed ten days ago might be treated as fresh for about a day.
It's how web caching got started, and why a response with no caching
headers can still come from a cache.

## Validation: asking whether it changed

A stale copy can be made fresh again with a **conditional request**.
There are two kinds of validator:

- **`Last-Modified`**, a date. The cache asks with
  `If-Modified-Since`. Dates have one-second resolution, so two changes
  within one second can look like one.
- **`ETag`**, an opaque string the server chooses: a revision number,
  or a hash of the content. The cache asks with `If-None-Match`.

If the request has both, `If-None-Match` wins. Caches often send both
anyway, for old intermediaries that only understand dates.

An ETag is **strong** by default, meaning it changes whenever the bytes
of a 200 response would change. A hash of the content is enough to make
one. Prefix it with `W/` and it's **weak**: it only promises the two
versions are equivalent for the server's purposes. Weak ETags are fine
for cache validation. If you send the same ETag for
the gzipped and the uncompressed version of a file, it's weak by
definition.

The server's answer to a conditional GET is either:

- **`304 Not Modified`**, with no body. It must repeat the caching
  headers a 200 would have had (`Cache-Control`, `Date`, `ETag`,
  `Vary`), and the cache copies them onto its stored response. That's
  how a revalidated copy gets a new lifetime.
- **`200 OK`** with the new content, which replaces the old copy.

## Vary and the cache key

A cache finds stored responses by a **cache key**: at least the method
and the URL, and in practice often just the URL, since most caches only
store GET.

But one URL can have several representations. `/app.css` may come
gzipped or not, `/` in English or Japanese. The `Vary` response header
lists the request headers the server used to choose:

```http
Vary: Accept-Encoding
```

Now a stored response is reused only for requests whose
`Accept-Encoding` matches the original request's. `Vary` extends the
cache key.

It's easy to wreck your hit ratio this way. `Vary: User-Agent` splits
one URL into a huge number of entries. `Vary: *` never matches, so
every reuse needs the origin. For personalized pages, `Vary: Cookie` is the
wrong tool; mark them `private`. And don't expect every cache to keep
every variant: in 2017 tests, all the browsers tested kept only one
variant per URL at a time.

## Serving stale on purpose

By default a cache may serve a stale response only when it can't reach
the origin, or when the server or client explicitly allows it. RFC 5861
(2010), from Mark Nottingham at Yahoo!, added two extensions that do:

```http
Cache-Control: max-age=600, stale-while-revalidate=30, stale-if-error=1200
```

- **`stale-while-revalidate=30`**: for 30 seconds after going stale,
  the cache may answer with the stale copy immediately and revalidate
  in the background. If no request comes in during those 30 seconds,
  nothing refreshes it, and the next request waits as usual.
- **`stale-if-error=1200`**: for up to 1,200 seconds after going stale,
  if the origin answers with 500, 502, 503 or 504, or can't be reached,
  the cache may answer with the stale copy instead of the error.

![Timeline of one cached response with max-age=600, stale-while-revalidate=30 and stale-if-error=1200. From 0 to 600 seconds it is fresh and served directly. From 600 to 630 seconds a request gets the stale copy at once while the cache revalidates in the background. Until 1,800 seconds, if the origin fails, the stale copy is served instead of the error. After that, errors go through to the client.](img/http-caching-stale-windows.svg)

*The two stale windows. Values from the examples in Mark Nottingham, RFC 5861, "HTTP Cache-Control Extensions for Stale Content" (2010).*

Add the windows up to see the worst case. With `max-age=600` and
`stale-while-revalidate=600`, a response can be served from cache for
up to 20 minutes. `must-revalidate`, `no-cache` and (in shared caches)
`s-maxage` switch all of this off. CDNs such as Fastly support both.

## Getting a response back out

HTTP has almost no way to take a stored response back.

- When a cache sees a successful POST, PUT or DELETE to a URL, it must
  invalidate what it stored for that URL. But only caches the request
  passes through see it. The browser that posted a comment drops its
  copy; every other browser and cache keeps theirs.
- There's no "delete" message. The `Clear-Site-Data` header can clear
  the browser's cache, and has no effect on caches in between.
- Managed caches you control, like a CDN, can be purged through their
  own API. That's outside HTTP; see [[cdn]].

So `max-age=31536000` on `/app.css` is a promise you can't recall. The
fix is to never change what a URL means. Put a version or hash in the
file name (`app.3f9a.css`), give it a year, and when it changes, publish
a new URL and point the HTML at it. The HTML itself can't be renamed,
so give it `no-cache` and an ETag: every visit checks, and an
unchanged page costs a small 304.

Even then, a reload makes browsers revalidate every subresource, each
check coming back 304. `immutable` tells them not to while it's fresh.
Chrome didn't implement it, and stopped revalidating subresources on
reload instead.

## Where it gets tricky

**Cookies don't make a response private.** The spec says `Set-Cookie`
doesn't stop caching, and a cacheable response with one can be served
to others. Cloudflare, by default, refuses to cache anything with
`Set-Cookie`. Other caches may not. The only reliable signal is
`private` (or `no-store`).

**`no-cache` or `no-store`?** For "always up to date", `no-cache` is
usually better: checks are cheap and browsers keep their back/forward
cache. And `no-store` doesn't remove a copy stored earlier.

**The kitchen-sink header** `no-store, no-cache, max-age=0,
must-revalidate, proxy-revalidate` is a workaround for old proxy
caches. In 2017 tests, `no-store` and `no-cache` alone worked in every
browser tested, and HTTPS hides most old proxies anyway.
`max-age=0, must-revalidate` is an old spelling of `no-cache`.

**Request collapsing can share a `no-cache` response.** When many
identical requests arrive at a shared cache together, it may send one
to the origin and give its answer to all of them, even if that answer
says `no-cache`. If the response is personal, it must say `private`.

**Parts of the spec aren't implemented.** The forms of `private` and
`no-cache` that name specific headers are usually treated as the plain
directive. Request directives are only advisory: in 2017 tests, Chrome
ignored `max-stale` and `min-fresh`. Browsers also differed on which
status codes they would cache.

**Caches spread mistakes.** A poisoned response stored in a shared
cache goes to everyone who asks for that URL. One common way in is
parsing differences between proxies, which is [[request-smuggling]].
`immutable` makes it worse by pinning a bad copy, so browsers should
ignore it on plain HTTP.

**A long lifetime is a ceiling.** Many caches evict responses far
sooner than a year.

DNS has its own version of these ideas; see [[dns-caching]].

## What this means when you build

- Send `Cache-Control` on every response, or caches guess.
- Static files: hash in the name, `max-age=31536000, immutable`.
- HTML and API responses that must be current: `no-cache` plus an ETag,
  and answer `If-None-Match` with 304.
- Anything personal: `private` (with `no-cache` if it changes). Never
  rely on cookies to keep it out of shared caches.
- Keep `Vary` short: `Accept-Encoding` is fine, `User-Agent` isn't.
- Add `stale-while-revalidate` and `stale-if-error` where a slightly
  old answer beats a slow one or an error.

## Further reading

- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111), R. Fielding, M. Nottingham, J. Reschke (editors), IETF, 2022. The rules: storage, freshness, Age, validation, invalidation, and every directive.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110), R. Fielding, M. Nottingham, J. Reschke (editors), IETF, 2022. Validators, strong and weak ETags, conditional requests, 304, Vary, and which methods and status codes are cacheable.
- [RFC 5861: HTTP Cache-Control Extensions for Stale Content](https://www.rfc-editor.org/rfc/rfc5861), M. Nottingham, 2010. `stale-while-revalidate` and `stale-if-error`, with worked examples.
- [RFC 8246: HTTP Immutable Responses](https://www.rfc-editor.org/rfc/rfc8246), P. McManus, IETF, 2017. Why versioned URLs still get revalidated on reload, and the `immutable` fix.
- [RFC 9213: Targeted HTTP Cache Control](https://www.rfc-editor.org/rfc/rfc9213), S. Ludin, M. Nottingham, Y. Wu, IETF, 2022. `CDN-Cache-Control`, for when one header can't serve every cache.
- [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), MDN contributors. The clearest walk-through, with header patterns for static files, HTML and personal pages.
- [The State of Browser Caching, Revisited](https://mnot.net/blog/2017/browser-caching), Mark Nottingham, 2017. What browsers actually did when tested against the spec.
- [Default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/), Cloudflare docs. A CDN whose defaults are stricter than the spec, including on `Set-Cookie`.
- [Caching content with Fastly](https://www.fastly.com/documentation/guides/concepts/edge-state/cache/), Fastly docs. A CDN cache that follows RFC 9111, revalidates on its own and supports the stale extensions.
