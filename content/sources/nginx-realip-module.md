---
id: nginx-realip-module
title: Module ngx_http_realip_module
author: nginx documentation
url: https://nginx.org/en/docs/http/ngx_http_realip_module.html
kind: docs
primary: true
---

## Summary

nginx's module for replacing the connection's client address with one
taken from a header (X-Forwarded-For, X-Real-IP) or from the PROXY
protocol, but only when the connection comes from a trusted address.

## Key claims

- It changes the client address to the one in a header. "The ngx_http_realip_module module is used to change the client address and optional port to those sent in the specified header field." (intro)
- It isn't built by default. "This module is not built by default, it should be enabled with the --with-http_realip_module configuration parameter." (intro)
- `set_real_ip_from` lists the trusted senders. "Defines trusted addresses that are known to send correct replacement addresses." (set_real_ip_from)
- The address can also come from the PROXY protocol. "The proxy_protocol parameter (1.5.12) changes the client address to the one from the PROXY protocol header." (real_ip_header)
- Non-recursive: take the last address in the header. "If recursive search is disabled, the original client address that matches one of the trusted addresses is replaced by the last address sent in the request header field defined by the real_ip_header directive." (real_ip_recursive)
- Recursive: take the last address that isn't trusted. "If recursive search is enabled, the original client address that matches one of the trusted addresses is replaced by the last non-trusted address sent in the request header field." (real_ip_recursive)

## Visuals worth redrawing

None.

## My notes

- This is the "trusted proxy list, search from the right" rule from
  MDN, as a config.
