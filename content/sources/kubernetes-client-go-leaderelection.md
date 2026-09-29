---
id: kubernetes-client-go-leaderelection
title: "Package leaderelection (k8s.io/client-go/tools/leaderelection)"
author: Kubernetes authors
url: https://pkg.go.dev/k8s.io/client-go/tools/leaderelection
kind: code
primary: true
---

## Summary

The Go package docs for Kubernetes' client-side leader election (client-go
v0.37.1 on pkg.go.dev), used by controllers to pick one active replica
through a lock object in the API server. The overview is blunt: it does
not fence, it only trusts local clocks, and it tolerates clock skew but
not a difference in clock rate beyond what LeaseDuration/RenewDeadline
allows.

## Key claims

- The election record lives in a Kubernetes API object. "It uses an annotation in the endpoints object to store the record of the election state." (Overview)
- RenewDeadline default. "Core clients default this value to 10 seconds." (LeaderElectionConfig, RenewDeadline)
- No fencing. "This implementation does not guarantee that only one client is acting as a leader (a.k.a. fencing)." (Overview)
- Timestamps in the record aren't trusted; only local time and the fact that the record changed. "A client only acts on timestamps captured locally to infer the state of the leader election." (Overview)
- Tolerates any clock offset, not any clock rate difference. "Thus the implementation is tolerant to arbitrary clock skew, but is not tolerant to arbitrary clock skew rate." (Overview)
- Rate tolerance comes from the LeaseDuration to RenewDeadline ratio; 60 s and 30 s tolerates one clock running twice as fast. "the user could set LeaseDuration to 60 seconds and RenewDeadline to 30 seconds." (Overview)
- Skew tolerance trades against availability. "the tolerance to skew rate varies inversely to master availability." (Overview)
- LeaseDuration: how long non-leaders wait before taking over; core clients default to 15 s. "Core clients default this value to 15 seconds." (LeaderElectionConfig, LeaseDuration)
- A candidate must see no change for a full LeaseDuration before taking over. "A client needs to wait a full LeaseDuration without observing a change to the record before it can attempt to take over." (LeaderElectionConfig)
- RenewDeadline: how long the leader keeps retrying renewal before giving up; default 10 s. "RenewDeadline is the duration that the acting master will retry refreshing leadership before giving up." (LeaderElectionConfig)
- RetryPeriod: wait between tries; default 2 s. "Core clients default this value to 2 seconds." (LeaderElectionConfig, RetryPeriod)
- ReleaseOnCancel can cause two active leaders if guarded work hasn't finished. "you must ensure all code guarded by this lease has successfully completed prior to cancelling the context, or you may have two processes simultaneously acting on the critical path." (LeaderElectionConfig, ReleaseOnCancel)

## Visuals worth redrawing

None.

## My notes

- The overview still says it uses "an annotation in the endpoints object";
  current Kubernetes uses Lease objects (coordination.k8s.io), per the
  Kubernetes "Leases" concept page. Stale wording in the package doc.
- The package is still labelled an alpha API in its own disclaimer.
