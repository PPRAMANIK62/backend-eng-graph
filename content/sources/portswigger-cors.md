---
id: portswigger-cors
title: Cross-origin resource sharing (CORS)
author: PortSwigger Web Security Academy
url: https://portswigger.net/web-security/cors
kind: docs
primary: false
---

## Summary

PortSwigger's page on CORS vulnerabilities, written with the PortSwigger
researchers who popularised the attack class: reflecting any Origin,
broken allow-list matching, trusting `null`, trusting XSS-prone or
plain-HTTP subdomains, and wildcard access to intranets.

## Key claims

- CORS is not a CSRF defense. "CORS is not a protection against cross-origin attacks such as cross-site request forgery (CSRF)." (intro)
- The same-origin policy allows requests but not reading responses. "It generally allows a domain to issue requests to other domains, but not to access the responses." (Same-origin policy)
- The worst mistake: reflect whatever Origin arrives, with credentials allowed. "Because the application reflects arbitrary origins in the Access-Control-Allow-Origin header, this means that absolutely any domain can access resources from the vulnerable domain." (Server-generated ACAO header from client-specified Origin header)
- Prefix, suffix and regex matching go wrong. "These rules are often implemented by matching URL prefixes or suffixes, or using regular expressions." (Errors parsing Origin headers)
- Suffix check `normal-website.com` lets in `hackersnormal-website.com`; prefix check lets in `normal-website.com.evil-user.net`. (Errors parsing Origin headers, examples)
- Browsers send `Origin: null` in several odd cases (cross-origin redirects, serialized data, file:, sandboxed requests), and a sandboxed iframe lets an attacker send it on purpose. "In this situation, an attacker can use various tricks to generate a cross-origin request containing the value null in the Origin header." (Whitelisted null origin value)
- A trusted origin with XSS hands its trust to the attacker. "If a website trusts an origin that is vulnerable to cross-site scripting (XSS), then an attacker could exploit the XSS to inject some JavaScript that uses CORS to retrieve sensitive information from the site that trusts the vulnerable application." (Exploiting XSS via CORS trust relationships)
- Trusting an http:// subdomain lets a network attacker read HTTPS data. "This attack is effective even if the vulnerable website is otherwise robust in its usage of HTTPS, with no HTTP endpoint and all cookies flagged as secure." (Breaking TLS with poorly configured CORS)
- Without Allow-Credentials the attacker only gets public content, except on intranets. "Without that header, the victim user's browser will refuse to send their cookies, meaning the attacker will only gain access to unauthenticated content, which they could just as easily access by browsing directly to the target website." (Intranets and CORS without credentials)
- `Access-Control-Allow-Origin: *` on an intranet app turns the victim's browser into a proxy. "If users within the private IP address space access the public internet then a CORS-based attack can be performed from the external site that uses the victim's browser as a proxy for accessing intranet resources." (Intranets and CORS without credentials)

## Visuals worth redrawing

None.

## My notes

- The page credits the PortSwigger research talk "Exploiting CORS
  misconfigurations for Bitcoins and bounties"; not opened.
