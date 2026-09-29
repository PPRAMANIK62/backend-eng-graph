---
id: chromium-http-pipelining
title: HTTP Pipelining (Chromium network stack design document)
author: The Chromium Projects
url: https://www.chromium.org/developers/design-documents/network-stack/http-pipelining/
kind: docs
primary: true
---

## Summary

Chromium's design document for its attempt to turn on HTTP/1.1
pipelining. It lists the risks (broken servers, broken proxies,
front-of-queue blocking), the checks they added before pipelining to an
origin, and the outcome: the option was removed from Chrome.

## Key claims

- The goal was speed. "Speed up Chrome's network stack by enabling HTTP Pipelining." (Objective)
- Servers may mishandle pipelined requests. "Servers may ignore pipelined requests or corrupt the responses." (Risks)
- Proxies too, including transparent ones the user never configured. "Some users are behind \"transparent proxies,\" where the requests are proxied even though the user has not explicitly specified a proxy in their system configuration." (Risks)
- The first request can block the rest. "The first request in a pipeline may block other requests in the pipeline. The net result of pipelining may be slower page loads." (Risks)
- Mitigation: only pipeline to origins that proved HTTP/1.1, known length, keep-alive, no auth; blacklist on failure. "If at any point one of these fail, the origin is black-listed in the client." (Mitigation)
- Outcome: removed. "The option to enable pipelining has been removed from Chrome, as there are known crashing bugs and known front-of-queue blocking issues." (Status)
- Middleboxes were a large part of the problem. "There are also a large number of servers and middleboxes that behave badly and inconsistently when pipelining is enabled." (Status)

## Visuals worth redrawing

None.

## My notes

- The page doesn't say which Chrome version removed it.
