---
id: redis-client-handling
title: Redis client handling
author: Redis
url: https://redis.io/docs/latest/develop/reference/clients/
kind: docs
primary: true
---

## Summary

How the Redis server handles client connections (Redis 2.6 and later):
non-blocking sockets and multiplexing, the maxclients limit, per-client
output buffer limits, the query buffer limit, client eviction (7.0),
idle timeouts and TCP keepalive. The output buffer limits are Redis's
answer to a client that reads replies slower than it asks for them.

## Key claims

- Client sockets are non-blocking and multiplexed. "The client socket is put in the non-blocking state since Redis uses multiplexing and non-blocking I/O." (Accepting Client Connections)
- TCP_NODELAY is set on each client. "The TCP_NODELAY option is set in order to ensure that there are no delays to the connection." (Accepting Client Connections)
- Over maxclients, Redis sends an error and closes. "it tries to send an error to the client in order to make it aware of this condition, closing the connection immediately." (Accepting Client Connections)
- One read() per readable event, for fairness. "It only performs a single read() system call every time there is something new to read from the client socket." (What Order are Client Requests Served In?)
- Default maxclients is 10,000. "The default is 10,000 clients." (Maximum Concurrent Connected Clients)
- Redis lowers maxclients to fit the fd soft limit, reserving 32 fds. (Maximum Concurrent Connected Clients)
- Each client has a variable-length output buffer. "Redis needs to handle a variable-length output buffer for every client" (Output Buffer Limits)
- A client can ask for output faster than it reads it. "it is possible that a client sends more commands producing more output to serve at a faster rate than that which Redis can send the existing output to the client." (Output Buffer Limits)
- Pub/Sub clients are the usual case. "This is especially true with Pub/Sub clients in case a client is not able to process new messages fast enough." (Output Buffer Limits)
- At the limit, the connection is closed. "When the limit is reached the client connection is closed and the event logged in the Redis log file." (Output Buffer Limits)
- Hard limit closes at once; soft limit closes if exceeded continuously for a time. "a soft limit of 32 megabytes per 10 seconds means that if the client has an output buffer bigger than 32 megabytes for, continuously, 10 seconds, the connection gets closed." (Output Buffer Limits)
- Normal clients have no limit by default, because they usually wait for each reply. "Normal clients have a default limit of 0, that means, no limit at all" (Output Buffer Limits)
- Pub/Sub defaults: hard 32 MB, soft 8 MB per 60 s. "Pub/Sub clients have a default hard limit of 32 megabytes and a soft limit of 8 megabytes per 60 seconds." (Output Buffer Limits)
- Replicas: hard 256 MB, soft 64 MB per 60 s. (Output Buffer Limits)
- The query buffer has a fixed 1 GB hard limit. "This is a non-configurable hard limit that will close the connection when the client query buffer (that is the buffer we use to accumulate commands from the client) reaches 1 GB" (Query Buffer Hard Limit)
- Client eviction (Redis 7.0) caps total client memory, off by default. "The default setting is 0, meaning client eviction is turned off by default." (Client Eviction)
- Client eviction disconnects the biggest clients first. "The mechanism first attempts to disconnect clients that use the most memory." (Client Eviction)
- TCP keepalive is on by default since Redis 3.2, about 300 s. (TCP keepalive)
- The client eviction setting is maxmemory-clients. "maxmemory-clients defines the maximum aggregate memory usage of all clients connected to Redis." (Client Eviction)

## Visuals worth redrawing

None.

## My notes

- Output buffer limits are load shedding at the connection level:
  Redis can't slow a Pub/Sub publisher down for one slow subscriber, so
  it drops the subscriber. Our reading, not the page's words.
