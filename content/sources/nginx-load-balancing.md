---
id: nginx-load-balancing
title: Using nginx as HTTP load balancer
author: nginx documentation
url: https://nginx.org/en/docs/http/load_balancing.html
kind: docs
primary: true
---

## Summary

nginx's introductory page on HTTP load balancing: round robin (the
default), least connected, least time, IP hash for stickiness,
weights, and passive health checks.

## Key claims

- Round robin is the default. "When the load balancing method is not specifically configured, it defaults to round-robin." (Default load balancing configuration)
- Least connected helps when some requests take longer. "Least-connected allows controlling the load on application instances more fairly in a situation when some of the requests take longer to complete." (Least connected load balancing)
- Round robin and least connected give no stickiness. "There is no guarantee that the same client will be always directed to the same server." (Session persistence)
- IP hash ties a client to a server unless that server is down. "This method ensures that the requests from the same client will always be directed to the same server except when this server is unavailable." (Session persistence)
- Weights: with weight 3 on one of three servers, 5 requests go 3/1/1. "every 5 new requests will be distributed across the application instances as the following: 3 requests will be directed to srv1, one request will go to srv2, and another one — to srv3." (Weighted load balancing)
- Health checks are passive (in-band): a failed server is avoided for a while. "Reverse proxy implementation in nginx includes in-band (or passive) server health checks." (Health checks)
- `max_fails` defaults to 1; after `fail_timeout` nginx probes the server with live requests. "After fail_timeout interval following the server failure, nginx will start to gracefully probe the server with the live client’s requests." (Health checks)

## Visuals worth redrawing

None.

## My notes

- Active checks (`health_check`) are in the commercial version only,
  per the upstream module page.
