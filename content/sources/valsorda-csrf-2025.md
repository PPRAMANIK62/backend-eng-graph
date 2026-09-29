---
id: valsorda-csrf-2025
title: Cross-Site Request Forgery
author: Filippo Valsorda
url: https://words.filippo.io/csrf/
kind: blog
primary: true
---

## Summary

The research behind Go 1.25's CrossOriginProtection middleware (2025),
by the Go cryptography maintainer who proposed it. Defines CSRF, the
difference between same-site and same-origin, weighs every
countermeasure (tokens, Origin, SameSite, non-simple requests, Fetch
Metadata), and gives a short algorithm based on Sec-Fetch-Site.

## Key claims

- CSRF is a confused deputy attack using the user's cookies or network position. "Cross-Site Request Forgery (CSRF) is a confused deputy attack where the attacker causes the browser to send a request to a target using the ambient authority of the user’s cookies or network position." (intro)
- Apps that authenticate with cookies need protection. "Essentially all applications that use cookies for authentication need to protect against CSRF." (intro)
- CSRF is about accepting requests; CORS is about sharing responses. "Unlike Cross-Origin Resource Sharing (CORS), which is about sharing responses across origins, CSRF is about accepting state-changing requests, even if the attacker will not see the response." (intro)
- Browsers allow these requests for legacy reasons, and SSO depends on it. "Like anything in the Web platform, primarily for legacy reasons: that’s how it used to work and changing it breaks things." (intro)
- Subdomains of one site can be the same site but different origins, with different trust. "https://app.example.com, https://marketing.example.com, and even http://app.example.com (depending on the definition) are all same-site but not same-origin." (Same site vs same site vs same origin)
- CSRF tokens turn a forgery problem into a leak problem. "This countermeasure turns a cross-origin forgery problem into a cross-origin leak problem" (Double submit or synchronized tokens)
- Tokens' main cost is wiring them into every form. "The primary issue with CSRF tokens is that they require developers to instrument all their forms and other POST requests." (Double submit or synchronized tokens)
- A null Origin means cross-origin. "null must be treated as an indication of a cross-origin request." (Origin header)
- SameSite is a cross-site defense, not cross-origin. "This is, by design, not a cross-origin protection" (SameSite cookies)
- The Lax-by-default rollout mostly failed. "Note that the rollout of SameSite Lax by default has mostly failed due to widespread breakage, especially in SSO flows." (SameSite cookies)
- CORS preflights aren't a CSRF defense, since forms make simple requests. "Although CORS is not designed to protect against CSRF, “non-simple requests” which for example set headers that a simple <form> couldn’t set are preflighted by an OPTIONS request." (Non-simple requests)
- Sec-Fetch-Site is the recommended signal and is in all major browsers. "The header has been available in all major browsers since 2023 (and earlier for all but Safari)." (Fetch metadata)
- It's only sent to trustworthy (HTTPS or localhost) targets. "One limitation is that it is only sent to “trustworthy origins”, i.e. HTTPS and localhost." (Fetch metadata)
- The algorithm: allow GET, HEAD, OPTIONS; allow trusted origins; if Sec-Fetch-Site is present allow only same-origin or none; if neither header is present allow; else compare Origin's host with Host. (Protecting against CSRF in 2025, steps 1 to 5)
- Requests with neither header aren't from modern browsers. "These requests are not from (post-2020) browsers, and can’t be affected by CSRF." (step 4)
- Network-position abuse (often via DNS rebinding) is being handled by Private Network Access. "Abuse of the ambient authority of network position, often through DNS rebinding, is being addressed by Private Network Access." (footnote 1)
- API traffic generally doesn't need CSRF protection. "This is why API traffic generally doesn’t need to be protected against CSRF." (footnote 2)
- Allow-listed origins are full origins compared by equality. "Trusted origins should be configured as full origins (e.g. https://example.com) and compared by simple equality with the header value." (step 2)
- Keep a narrow bypass for single sign-on edge cases. "Finally, there should be a tightly scoped bypass mechanism for e.g. SSO edge cases" (end)
- Same-site origins can differ in trust, like an old marketing blog. "for example it might be much easier to get XSS into an old marketing blog than in the admin panel." (Same site vs same site vs same origin)
- Go 1.25 ships this. "Go 1.25 introduces a CrossOriginProtection middleware in net/http which implements this algorithm." (end)
- API traffic that isn't from a browser can't be CSRF. "If it looks like it’s not from a browser, it can’t be a CSRF." (footnote 2)
- What the browsers ended up with instead of Lax by default. "Some browsers now default to Lax-allowing-unsafe, while others default(ed) to None for the first two minutes after the cookie was set. These defaults are not effective CSRF countermeasures." (SameSite cookies)
- Fetch metadata as the primary defense, with no form changes. "The most developer-friendly way to do so is using primarily Fetch metadata, which requires no extra instrumentation or configuration." (Protecting against CSRF in 2025)

## Visuals worth redrawing

None.

## My notes

- Written by the person who designed the Go feature, so primary for Go's
  behaviour and a strong opinion on the rest. OWASP (owasp-csrf-cheat-
  sheet) still recommends tokens by default.
