---
id: aws-nlb-docs
title: Network Load Balancers (Elastic Load Balancing user guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/elasticloadbalancing/latest/network/network-load-balancers.html
kind: docs
primary: true
---

## Summary

AWS's page on Network Load Balancer settings. The part used here is
the connection idle timeout: the balancer tracks each TCP flow and
forgets it after a quiet period, after which the connection is dead.

## Key claims

- The balancer stops tracking a connection with no data for longer than the idle timeout. "If no data is sent through the connection by either the client or target for longer than the idle timeout, the connection is no longer tracked." (Connection idle timeout)
- Sending afterwards gets an RST. "If a client or target sends data after the idle timeout period elapses, the client receives a TCP RST packet to indicate that the connection is no longer valid." (Connection idle timeout)
- Default 350 seconds for TCP, adjustable from 60 to 6000. "The default idle timeout value for TCP flows is 350 seconds, but can be updated to any value between 60-6000 seconds." (Connection idle timeout)
- TCP keepalives reset the timer. "Clients or targets can use TCP keepalive packets to restart the idle timeout." (Connection idle timeout)
- UDP flows: 120 seconds. "Elastic Load Balancing sets the idle timeout value for UDP flows to 120 seconds." (Connection idle timeout)

## Visuals worth redrawing

None.

## My notes

- 350 s is far below Linux's 2-hour keepalive default, so default
  keepalives never keep an NLB flow alive.
