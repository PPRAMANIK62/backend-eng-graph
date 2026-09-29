---
id: shopify-toxiproxy
title: Toxiproxy (README)
author: Shopify
url: https://github.com/Shopify/toxiproxy
kind: code
primary: true
---

## Summary

Shopify's TCP proxy for injecting network faults in tests and CI, read from
the README on the main branch (latest release v2.12.0 when this was
written). You point your app at the proxy instead of the real service, then
add "toxics" over an HTTP API: latency, bandwidth limits, timeouts, resets,
slicing, data limits, packet loss, or taking the service down.

## Key claims

- What it's for. "Toxiproxy is a framework for simulating network conditions. It's made specifically to work in testing, CI and development environments" (intro)
- Deterministic tampering by default, randomness if you want it. "supporting deterministic tampering with connections, but with support for randomized chaos and customization." (intro)
- Two parts: a Go TCP proxy and a client that talks to it over HTTP. "A TCP proxy written in Go (what this repository contains) and a client communicating with the proxy over HTTP." (intro)
- Why they built it: needed a dynamic API for tests, and Linux tools need root. "Linux tools like `nc` and so on are not cross-platform and require root, which makes them problematic in test, development and CI environments." (Why yet another chaotic TCP proxy?)
- Latency toxic: delay equal to latency plus or minus jitter. "Add a delay to all data going through the proxy." (Toxics, latency)
- Down: disable the proxy. "This is done by `POST`ing to `/proxies/{proxy}` and setting the `enabled` field to `false`." (Toxics, down)
- Timeout toxic: stop all data, optionally close later. "Stops all data from getting through, and closes the connection after `timeout`." (Toxics, timeout)
- reset_peer simulates a TCP reset. "Simulate TCP RESET (Connection reset by peer) on the connections" (Toxics, reset_peer)
- Other toxics: bandwidth, slow_close, slicer, limit_data, packet_loss (drops chunks, with an optional burst correlation). "Randomly drops chunks flowing through the proxy" (Toxics, packet_loss)
- Each toxic applies upstream (client to server) or downstream (server to client). "`upstream` applies the toxic on the `client -> server` connection" (HTTP API, Toxic fields)
- toxicity: probability a toxic applies to a connection. "`toxicity`: probability of the toxic being applied to a link (defaults to 1.0, 100%)" (HTTP API, Toxic fields)
- Overhead with no toxics under 100 µs. "you can expect a latency of *< 100µs* when no toxics are enabled." (FAQ)
- MySQL clients on `localhost` may bypass it via the Unix socket. "MySQL will prefer the local Unix domain socket for some clients, no matter which port you pass it if the host is set to `localhost`." (FAQ)

## Visuals worth redrawing

None.

## My notes

- Works at the TCP level between one client and one service, so it can't
  isolate a node from its peers the way iptables can, unless every peer
  connection goes through a proxy.
