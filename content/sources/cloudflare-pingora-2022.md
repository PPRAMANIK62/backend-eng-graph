---
id: cloudflare-pingora-2022
title: How we built Pingora, the proxy that connects Cloudflare to the Internet
author: Yuchen Wu and Andrew Hauck, Cloudflare
url: https://blog.cloudflare.com/how-we-built-pingora-the-proxy-that-connects-cloudflare-to-the-internet/
kind: blog
primary: true
---

## Summary

Why Cloudflare replaced NGINX with its own Rust proxy, Pingora, for
traffic to customer origins (2022). The main reason was connection
reuse: NGINX keeps a separate upstream pool per worker process.

## Key claims

- Poor connection reuse was the main problem. "The most critical problem for our use cases is poor connection reuse." (Architecture limitations)
- Reuse skips TCP and TLS handshakes. "Connection reuse speeds up TTFB (time-to-first-byte) of requests by reusing previously established connections from a connection pool, skipping TCP and TLS handshakes required on a new connection." (Architecture limitations)
- NGINX pools are per worker. "However, the NGINX connection pool is per worker." (Architecture limitations)
- More workers makes reuse worse. "When we add more NGINX workers to scale up, our connection reuse ratio gets worse because the connections are scattered across more isolated pools of all the processes." (Architecture limitations)
- With shared pools, one major customer's reuse went from 87.1% to 99.92%, cutting new origin connections by 160x. "For one major customer, it increased the connection reuse ratio from 87.1% to 99.92%, which reduced new connections to their origins by 160x." (Pingora is faster in production)
- Pingora used about 70% less CPU and 67% less memory for the same traffic. "In production, Pingora consumes about 70% less CPU and 67% less memory compared to our old service with the same traffic load." (More efficient)
- Pingora is multithreaded so all threads can share connection pools. "We chose multithreading over multiprocessing in order to share resources, especially connection pools, easily." (Design decisions)
- The reuse gain comes from sharing connections across threads. "The savings come from our new architecture which can share connections across all threads." (Pingora is faster in production)

## Visuals worth redrawing

- Per-worker pools vs one shared pool.

## My notes

- Cloudflare's numbers from their production, one customer; not general.
