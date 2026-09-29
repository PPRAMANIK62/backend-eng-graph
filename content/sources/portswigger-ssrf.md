---
id: portswigger-ssrf
title: "Server-side request forgery (SSRF)"
author: PortSwigger Web Security Academy
url: https://portswigger.net/web-security/ssrf
kind: docs
primary: false
---

## Summary

PortSwigger's attacker-side explanation of SSRF: attacks against the
server itself through loopback, against back-end systems, how common
filters are bypassed, blind SSRF, and hidden places URLs turn up.

## Key claims

- Definition. "Server-side request forgery is a web security vulnerability that allows an attacker to cause the server-side application to make requests to an unintended location." (What is SSRF?)
- Requests from localhost often skip access control. "if the request to the /admin URL comes from the local machine, the normal access controls are bypassed." (SSRF attacks against the server)
- One reason: the check lives in a component in front of the app. "The access control check might be implemented in a different component that sits in front of the application server." (SSRF attacks against the server)
- Internal systems are often weaker because the network was meant to protect them. "The back-end systems are normally protected by the network topology, so they often have a weaker security posture." (SSRF attacks against other back-end systems)
- Alternative spellings of 127.0.0.1 get past string filters. "Use an alternative IP representation of 127.0.0.1, such as 2130706433, 017700000001, or 127.1." (SSRF with blacklist-based input filters)
- A domain you control can resolve to 127.0.0.1. "Register your own domain name that resolves to 127.0.0.1." (SSRF with blacklist-based input filters)
- Redirects bypass filters. "Provide a URL that you control, which redirects to the target URL." (SSRF with blacklist-based input filters)
- Allow-list filters fall to URL parsing tricks: `https://expected-host:fakepassword@evil-host`, `https://evil-host#expected-host`, `https://expected-host.evil-host`. "You may be able to bypass this filter by exploiting inconsistencies in URL parsing." (SSRF with whitelist-based input filters)
- An open redirect on an allowed host defeats a strict allow-list if the client follows redirects. "Provided the API used to make the back-end HTTP request supports redirections, you can construct a URL that satisfies the filter and results in a redirected request to the desired back-end target." (Bypassing SSRF filters via open redirection)
- Blind SSRF: the response never comes back. "Blind SSRF vulnerabilities occur if you can cause an application to issue a back-end HTTP request to a supplied URL, but the response from the back-end request is not returned in the application's front-end response." (Blind SSRF vulnerabilities)
- Hidden sources of URLs: XML (via XXE) and the Referer header read by analytics. "Often the analytics software visits any third-party URLs that appear in the Referer header." (SSRF via the Referer header)

## Visuals worth redrawing

None worth redrawing.

## My notes

- Written for testers. Used here for the bypass list, not for defenses.
