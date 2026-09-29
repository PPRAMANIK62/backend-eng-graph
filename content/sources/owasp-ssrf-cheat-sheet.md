---
id: owasp-ssrf-cheat-sheet
title: Server-Side Request Forgery Prevention Cheat Sheet
author: OWASP Cheat Sheet Series
url: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's defensive guide to SSRF. Splits the problem into two cases:
the app only calls known internal services (use an allow-list), or it
must call any external URL, like webhooks (use a block-list plus DNS
checks). Covers URL parser disagreements, DNS tricks, network-level
controls, IMDSv2 and a minimum deny-list.

## Key claims

- SSRF isn't limited to HTTP; other schemes can be used. "SSRF is not limited to the HTTP protocol." (Overview of a SSRF common flow, notes)
- Examples of schemes: "(e.g. file://, phar://, gopher://, data://, dict://, etc.)" (Overview of a SSRF common flow, notes)
- Two cases, handled differently: requests only to known apps, or to any external address. "Application can send requests to ANY external IP address or domain name: Case when allowlist approach is unavailable." (Cases)
- Turn off redirect following, or redirects bypass the validation. "Disable the support for the following of the redirection in your web client in order to prevent the bypass of the input validation" (Case 1, Application layer, note)
- IP parsers differ on hex, octal and dword forms; use the parsed output for the comparison. "Use the output value of the method/library as the IP address to compare against the allowlist." (Case 1, IP address)
- Validating a domain by resolving it can be abused to point a legitimate-looking name at an internal IP. "It can be used by an attacker to bind a legit domain name to an internal IP address." (Case 1, Domain name)
- An allow-listed name still gets resolved again when the request is made. "Indeed, a DNS resolution will be made when the business code will be executed." (Case 1, Domain name)
- Don't accept whole URLs; they're hard to validate. "Do not accept complete URLs from the user because URL are difficult to validate and the parser can be abused depending on the technology used" (Case 1, URL)
- Two parsers can read different hosts from one string: `http://example.com\@evil.com` is example.com under the WHATWG URL Standard, evil.com in CPython's urllib. "Reject a URL whose host is not read identically by every parser in play, rather than reconciling the readings." (Case 1, URL)
- Take only a host, match it against the allow-list and build the request yourself. "Match the host against an allowlist, and build the request yourself." (Case 1, URL)
- Don't copy the rest of the user's URL across. "do not copy the other components of that URL across either" (Case 1, URL)
- For arbitrary destinations, only HTTP or HTTPS. "it will verify the value against an allowed list of protocols (HTTP or HTTPS)." (Case 2, validation flow step 3)
- IP parsers can be fooled by other encodings. "Verification of the proposed libraries has been performed regarding the exposure to bypasses (Hex, Octal, Dword, URL and Mixed encoding)" (Case 1, IP address)
- Network layer: firewall the app to only the flows it needs. "The objective of the Network layer security is to prevent the VulnerableApplication from performing calls to arbitrary applications." (Case 1, Network layer)
- For webhooks and the like, allow-lists don't work and a block-list is the best left. "Despite knowing that the block-list approach is not an impenetrable wall, it is the best solution in this scenario." (Case 2, Challenges)
- The app must recognise private, localhost and link-local ranges for IPv4 and IPv6. "the provided IP (V4 + V6) is not part of the official private networks ranges including also localhost and IPv4/v6 Link-Local addresses." (Case 2, Challenges)
- Check every address behind a name (A and AAAA). "the application will retrieve all the IP addresses behind the domain name provided (taking records A + AAAA for IPv4 + IPv6) and it will apply the same verification" (Case 2, validation flow step 2)
- Metadata services are the usual target. "In cloud environments SSRF is often used to access and steal credentials and access tokens from metadata services" (IMDSv2 in AWS)
- IMDSv2 is defense in depth that stops some SSRF. "IMDSv2 is an additional defense-in-depth mechanism for AWS that mitigates some of the instances of SSRF." (IMDSv2 in AWS)
- Deny-lists are a last resort. "Deny-lists are bypass-prone. Prefer allow-lists." (Deny-list (Last Resort))
- Minimum ranges to block: 169.254.169.254 and metadata hostnames, 127.0.0.0/8, 0.0.0.0/8, ::1/128, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 224.0.0.0/4, ff00::/8. (Deny-list table)
- The cheat sheet names the resolve-then-resolve-again bypass "DNS pinning". "Unfortunately here, the application is still vulnerable to the DNS pinning bypass mentioned in this document." (Case 1, Domain name)

## Visuals worth redrawing

- The "SSRF common flow" sequence: attacker, vulnerable application,
  targeted application, response relayed back. (Overview)

## My notes

- The cheat sheet calls the DNS trick "DNS pinning" and points to an
  external document for it; most other writing calls the same idea DNS
  rebinding. The article uses "DNS rebinding" for the name-changes-
  between-check-and-use problem and explains it without naming a source
  for the term.
