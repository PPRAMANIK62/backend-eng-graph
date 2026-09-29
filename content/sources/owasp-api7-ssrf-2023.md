---
id: owasp-api7-ssrf-2023
title: "API7:2023 Server Side Request Forgery"
author: OWASP API Security Project
url: https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/
kind: docs
primary: true
---

## Summary

The SSRF entry of the OWASP API Security Top 10 (2023). Basic vs blind
SSRF, why modern apps make it more common and more dangerous, two
examples (a profile picture URL used to port-scan, a webhook test that
reads cloud metadata credentials), and a prevention list.

## Key claims

- Definition: fetching a user-supplied URL without validating it. "Server-Side Request Forgery (SSRF) flaws occur when an API is fetching a remote resource without validating the user-supplied URL." (Is the API Vulnerable?)
- Basic SSRF (response comes back) is easier than blind SSRF. "In general, basic SSRF (when the response is returned to the attacker), is easier to exploit than Blind SSRF in which the attacker has no feedback on whether or not the attack was successful." (Threat agents/Attack vectors)
- Impact: scanning internal services, reading data, getting past firewalls. "Successful exploitation might lead to internal services enumeration (e.g. port scanning), information disclosure, bypassing firewalls, or other security mechanisms." (Impacts)
- The features that invite it. "Webhooks, file fetching from URLs, custom SSO, and URL previews." (Is the API Vulnerable?)
- Clouds, Kubernetes and Docker expose control channels over HTTP at known paths. "Modern technologies like cloud providers, Kubernetes, and Docker expose management and control channels over HTTP on predictable, well-known paths." (Is the API Vulnerable?)
- You can't always remove it completely. "The SSRF risk can not always be completely eliminated." (Is the API Vulnerable?)
- Timing reveals open ports even without a response body. "Based on the response time, the attacker can figure out whether the port is open or not." (Scenario #1)
- Webhook test requests that show the response can leak cloud credentials from `http://169.254.169.254/latest/meta-data/iam/security-credentials/...`. "Since the application shows the response from the test request, the attacker can view the credentials of the cloud environment." (Scenario #2)
- Prevention: isolate the fetcher. "Isolate the resource fetching mechanism in your network: usually these features are aimed to retrieve remote resources and not internal ones." (How To Prevent)
- Prevention: allow-lists of origins, schemes, ports and media types; no redirects; a well-tested URL parser; don't return raw responses. "Disable HTTP redirections." / "Use a well-tested and maintained URL parser to avoid issues caused by URL parsing inconsistencies." / "Do not send raw responses to clients." (How To Prevent)

## Visuals worth redrawing

None.

## My notes

- The OWASP SSRF cheat sheet (owasp-ssrf-cheat-sheet) has the detail on
  allow-list vs block-list and DNS.
