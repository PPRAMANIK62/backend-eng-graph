---
id: grpc-load-balancing
title: Load Balancing in gRPC
author: gRPC project (grpc/grpc repository docs)
url: https://github.com/grpc/grpc/blob/master/doc/load-balancing.md
kind: docs
primary: true
---

## Summary

The design doc for client-side load balancing in gRPC, read from the
repository's master branch. The resolver gives a list of addresses and
a service config; a pluggable LB policy opens subchannels and picks one
for each call.

## Key claims

- Balancing is per call, not per connection. "Load-balancing within gRPC happens on a per-call basis, not a per-connection basis." (Background)
- Even one client's calls should spread over all servers. "even if all requests come from a single client, we still want them to be load-balanced across all servers." (Background)
- The flow: name resolution returns addresses and a service config naming the LB policy; the policy creates subchannels and picks one per RPC. "For each RPC sent, the load balancing policy decides which subchannel (i.e., which server) the RPC should be sent to." (Workflow)
- `pick_first` is the default. "This is the default LB policy if the service config does not specify any LB policy." (pick_first)
- `pick_first` sends every call to the first reachable address. "all RPCs sent on the channel will be sent to that address." (pick_first)
- `round_robin` cycles over ready subchannels. "sending each successive RPC to the next successive subchannel in the list, wrapping around to the start of the list when needed." (round_robin)
- The look-aside `grpclb` policy is deprecated in favour of xDS. "This policy is deprecated.  We recommend using [xDS](grpc_xds_features.md) instead." (grpclb)

Added for `grpc`:

- `grpclb` was meant to move complex balancing out of the client into a look-aside balancer. "any more complex algorithms would be provided by a look-aside load balancer." (grpclb)

## Visuals worth redrawing

- The resolver -> LB policy -> subchannels workflow figure.

## My notes

- The default is not balancing at all: with `pick_first`, one client
  talks to one server until that connection breaks.
