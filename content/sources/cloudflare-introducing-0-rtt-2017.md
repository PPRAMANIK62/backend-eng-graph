---
id: cloudflare-introducing-0-rtt-2017
title: Introducing Zero Round Trip Time Resumption (0-RTT)
author: Nick Sullivan, Cloudflare
url: https://blog.cloudflare.com/introducing-0-rtt/
kind: blog
primary: true
---

## Summary

Cloudflare's 2017 launch post for TLS 1.3 0-RTT on its edge. Counts the
round trips before a first HTTPS request, how many connections were
resumptions, and how Cloudflare limited replay risk. A note at the top
says the feature was later turned off by default.

## Key claims

- The feature is no longer on by default (editor's note). "This post has been updated to reflect that the feature is no longer enabled by default." (note at top)
- About 40% of Cloudflare's HTTPS connections were resumptions. "Our measurements show that around 40% of HTTPS connections are resumptions (either via session IDs or session tickets)." (Connection setup)
- TLS 1.3 made new connections faster but not resumed ones. "One of the biggest advantages of TLS 1.3 over earlier versions is that it only requires one round trip to set up the connection, resumed or not." (Connection setup)
- TLS 1.2 resumption cut the handshake from two round trips to one. "the TLS handshake phase can be shortened from two round trips to one with TLS session resumption." (Connection setup)
- 0-RTT requests can be replayed by an attacker. "they can take a copy of the encrypted 0-RTT data (containing your first request) and send it to the server again pretending to be you." (Replay attacks)
- Browsers already retry requests, so apps must handle duplicates anyway. "Applications need to be replay safe to work with modern browsers, whether they support 0-RTT or not." (Replay attacks)
- Cloudflare only answered GETs without query parameters in 0-RTT. "Specifically, only GET requests with no query parameters are answered over 0-RTT." (Replay attacks)
- It also capped size and replay time. "We also implement a maximum size of 0-RTT requests, and limit how long they can be replayed." (Replay attacks)
- A header tells the origin a request came in as 0-RTT, so it can spot replays. "we relay this information to the origin by adding an extra header to 0-RTT requests." (Replay attacks)

## Visuals worth redrawing

- Round trips before the first byte: TCP, TLS 1.2, TLS 1.3, 0-RTT.

## My notes

- The post doesn't say why 0-RTT was later turned off by default.
