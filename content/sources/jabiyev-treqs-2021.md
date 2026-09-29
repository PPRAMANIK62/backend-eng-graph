---
id: jabiyev-treqs-2021
title: "T-Reqs: HTTP Request Smuggling with Differential Fuzzing"
author: Bahruz Jabiyev, Steven Sprecher, Kaan Onarlioglu, Engin Kirda
url: https://seclab.nu/static/publications/ccs2021treqs.pdf
kind: paper
primary: true
---

## Summary

A CCS 2021 paper that built a grammar-based differential fuzzer for
HTTP/1 requests and ran it against 10 servers, proxies and CDNs to find
pairs that disagree about where a request's body ends, the root of
request smuggling. It shows that servers correct on their own can be
exploitable together.

## Key claims

- Request smuggling comes from two servers on the path processing the same request differently. "HTTP Request Smuggling (HRS) is an attack that exploits the HTTP processing discrepancies between two servers deployed in a proxy-origin configuration" (Abstract)
- It's a problem of the pair, not of either server. "These processors may not necessarily be individually buggy; but when used together, they disagree on the parsing or semantics of a given HTTP request, which leads to a vulnerability." (1 Introduction)
- Differential fuzzing looks for different behavior on the same input. "the focus is to identify differing behavior between applications when given the same input." (2, Differential Fuzzing)
- Inputs come from a context-free grammar of HTTP requests, then get string and tree mutations. "a grammar-based fuzzer called T-Reqs that incorporates string and tree mutations targeting a large variety of HTTP headers, the request line, and the request body." (1 Introduction)
- Each server was tested alone as a reverse proxy in front of a feedback server, and mismatched body lengths were flagged. "We specifically look for mismatches between parsed message body lengths, and label those as discrepancies." (3, Stage 1)
- Suspect pairs were then stacked, proxy in front of origin, to confirm smuggling. (3, Stage 3)
- The 10 targets: Apache, NGINX, Tomcat, ATS, HAProxy, Squid, Varnish, Akamai, Cloudflare, CloudFront, default configs. (3)
- Not every discrepancy is exploitable. "The presence of a discrepancy is a red flag, but not all discrepancies necessarily lead to HRS." (3, Q3)
- Every part of a request can cause a discrepancy, not only Content-Length and Transfer-Encoding. "Our results show that attacks can indeed be induced by manipulating every part of a request" (1 Introduction)

Added for `fuzzing` audit:

- The tools avoid their own HTTP parsing. "in order to avoid adding a confounding layer of parsing in our own tools, we use low-level network programming." (3, Stage 1)

## Visuals worth redrawing

- Figure 1: inputs generated from a grammar, mutated, sent to each server, compared. (Section 3)

## My notes

- They avoided their own HTTP parsing in the harness ("we use low-level
  network programming") so the harness itself couldn't add a
  discrepancy. Worth copying in the lab.
