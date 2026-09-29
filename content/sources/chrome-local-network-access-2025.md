---
id: chrome-local-network-access-2025
title: New permission prompt for Local Network Access
author: Chris Thompson (Google Chrome)
url: https://developer.chrome.com/blog/local-network-access
kind: blog
primary: true
---

## Summary

The Chrome team's post (2025, with a later update) announcing the Local
Network Access permission prompt: a public site must ask the user before
it can send requests to the local network or to the user's own machine.
Says which address ranges count as local and when Chrome ships it.

## Key claims

- When it ships. "The Local Network Access permission prompt is launching in Chrome 142." (update at the top)
- Why. "The aim is to protect users from cross-site request forgery (CSRF) attacks targeting routers and other devices on private networks" (intro)
- It replaces Private Network Access, which used CORS preflights. "Chrome previously experimented with restricting access to local network devices with Private Network Access, which required CORS preflights where the target device opted in to being connected to" (intro, note)
- Only secure contexts may ask. "The ability to request this permission is restricted to secure contexts." (What is Local Network Access?)
- What counts, in the first milestone: public to local or loopback. "any request from the public network to a local network or loopback destination." (What kinds of requests are affected?)
- Local is decided by the address the name resolves to. "A local network is any destination that resolves to addresses reserved for local use." (What kinds of requests are affected?)
- The ranges: RFC 1918 private IPv4 (e.g. 192.168.0.0/16), link-local 169.254.0.0/16, IPv6 fc00::/7 and fe80::/10, and loopback 127.0.0.0/8 and ::1/128. (What kinds of requests are affected?)

## Visuals worth redrawing

None.

## My notes

- The post doesn't mention DNS rebinding by name; the spec's security
  section does (wicg-local-network-access, 5.2).
