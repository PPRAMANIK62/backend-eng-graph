---
id: wicg-local-network-access
title: Local Network Access (WICG Draft Community Group Report)
author: Chris Thompson, Hubert Chao (Google), editors
url: https://wicg.github.io/local-network-access/
kind: spec
primary: true
---

## Summary

The draft spec behind Chrome's Local Network Access: a public website
has to get the user's permission before its requests may reach a
private-network or loopback address. It replaces the earlier Private
Network Access proposal, which relied on preflight requests. Its
security section explains why the check has to run on the address the
browser actually connects to, because of DNS rebinding.

## Key claims

- The aim. "Local Network Access aims to prevent these undesired requests to insecure devices on the local network." (1)
- How: a permission instead of direct access. "This is achieved by deprecating direct access to local IP addresses from public websites, and instead requiring that the user grants permission to the initiating website to make connections to their local network." (1)
- It replaces Private Network Access. "This proposal builds on top of Chrome’s previously paused [PRIVATE-NETWORK-ACCESS] work but differs by gating access on a permission rather than via preflight requests." (1, note)
- CORS doesn't cover this, because the attack doesn't need to read the response. "No CORS preflight is triggered, and the attacker doesn’t care about reading the response, as the request itself is the CSRF attack." (1.1)
- The check runs on the address actually connected to. "The mitigation described here operates upon the IP address which the user agent actually connects to when loading a particular resource." (5.2)
- And on every new connection, because of rebinding. "This check MUST be performed for each new connection made, as DNS rebinding attacks may otherwise trick the user agent into revealing information it shouldn’t." (5.2)
- It's a mitigation, not a fix; local services still have to defend themselves. "The proposal in this document merely mitigates attacks against local web services, it cannot fully solve them." (5.3)
- Chromium only covers public-to-local so far. "Currently, Chromium only implements Local Network Access restrictions for public to local or loopback requests, and does not enforce the permission for cross-origin local requests." (2.2, note)

## Visuals worth redrawing

None.

## My notes

- A Draft Community Group Report, not a W3C standard. Read in the
  version current when this was written; it changes often.
