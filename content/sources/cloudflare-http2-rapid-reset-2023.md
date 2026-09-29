---
id: cloudflare-http2-rapid-reset-2023
title: "HTTP/2 Rapid Reset: deconstructing the record-breaking attack"
author: Lucas Pardue, Julien Desgats, Cloudflare
url: https://blog.cloudflare.com/technical-breakdown-http2-rapid-reset-ddos-attack/
kind: blog
primary: true
---

## Summary

Cloudflare's write-up of CVE-2023-44487 (2023). An attacker opens an
HTTP/2 stream with a request and cancels it at once with RST_STREAM,
over and over on one connection. A cancelled stream no longer counts
toward the concurrency limit, so the limit never stops the flood, while
the server has already started work on every request. It walks through
the stream state machine, a packet capture, and what broke in
Cloudflare's own proxies.

## Key claims

- The attack peaked just above 201 million requests per second. "eventually peaked just above 201 million requests per second." (intro)
- It came from a botnet of about 20,000 machines. "the attacker was able to generate such an attack with a botnet of merely 20,000 machines." (intro)
- It abuses the protocol itself, so every implementation was exposed. "Because the attack abuses an underlying weakness in the HTTP/2 protocol, we believe any vendor that has implemented HTTP/2 will be subject to the attack." (intro)
- HTTP/1.1 browsers work around serial requests with a pool of connections, up to 6 per host. "Browsers tend to work around these limitations by managing a pool of TCP connections (up to 6 per host)" (RST attack details)
- Client requests use odd stream IDs and responses can come back in any order, interleaved. "Responses can be served in any order, and frames from different streams can be interleaved." (RST attack details)
- A client can cancel one request with RST_STREAM without closing the connection. "Rather than needing to tear down the whole connection, a client can send a RST_STREAM frame for a single stream." (HTTP/2 request cancellation)
- A cancelled stream frees its concurrency slot at once. "When a client cancels a stream, it instantly gets the ability to open another stream in its place and can send another request immediately." (HTTP/2 request cancellation)
- The trouble comes when tearing down a cancelled request lags behind. "Where issues start to crop up is when there is any kind of delay or lag in tidying up." (Rapid resets leading to denial of service)
- Proxies that hand work off asynchronously are more exposed. "Therefore, these deployments are more likely to encounter issues from rapid resets." (Rapid resets leading to denial of service)
- The stream concurrency limit alone doesn't help. "stream concurrency on its own cannot mitigate rapid reset." (Rapid resets leading to denial of service)
- In their capture, one packet held 525 requests; HEADERS after the first were 9 bytes thanks to HPACK. "The first HEADERS frame is 26 bytes long, all subsequent HEADERS are only 9 bytes." and "In total, packet 15 contains 525 requests, going up to stream 1051." (Rapid Reset dissected)
- The client didn't wait for any replies. "The client did not have to wait for any return traffic from the server, it was only limited by the size of the packets it could send." (Rapid Reset dissected)
- Clients don't wait for SETTINGS and assume 100 streams, so lowering the limit to 64 broke real pages. "Before making this change, we were unaware that clients don't wait for SETTINGS and instead assume a concurrency of 100." (499 errors and the challenges for HTTP/2 stream concurrency)
- They went back to 100 after closing connections on legitimate clients. "As soon as we realized this interoperability issue, we changed the maximum stream concurrency to 100." (same)
- A useful defence: count a connection's resets and close it with GOAWAY past a threshold. "A very effective strategy to clamp down on such clients is to count the number of server resets during a connection, and when that exceeds some threshold value, close the connection with a GOAWAY frame." (same)
- The fix extended those protections to client-sent resets. "we were able to extend the existing protections to monitor client-sent RST_STREAM frames and close connections when they are being used for abuse." (Actions from the Cloudflare side)

- A GET with no body is one HEADERS frame with END_STREAM set. "The client sends the request as a HEADERS frame with the END_STREAM flag set to 1." (RST attack details)
- The response is HEADERS then DATA with END_STREAM. "the server sends HEADERS with END_STREAM flag set to 0, then DATA with END_STREAM flag set to 1." (RST attack details)
- HTTP/1.1 clients could only cancel by closing the connection. "cancel in-flight requests by closing the TCP connection and opening a new connection" (RST attack details)
- Requests are dispatched upstream as soon as they are read, before any reset is seen. "As each request is read (HEADERS and DATA frames) it is dispatched to an upstream service." (Rapid resets leading to denial of service)
- Earlier HTTP/2 implementation DoS bugs were found in 2019. "In 2019 several DoS vulnerabilities were uncovered related to implementations of HTTP/2." (Actions from the Cloudflare side)

- The attack is CVE-2023-44487, and Cloudflare cut its stream limit to 64 while responding. "While responding to DoS attacks enabled by CVE-2023-44487, Cloudflare reduced maximum stream concurrency to 64." (499 errors and the challenges for HTTP/2 stream concurrency)

## Visuals worth redrawing

- The HTTP/2 stream state diagram, and the timeline of three requests with stream 1 cancelled.

## My notes

- Google and AWS saw the same attack; Google's post gives a larger peak (398 million rps) for its own traffic.
