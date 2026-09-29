---
id: kubernetes-probes
title: Liveness, Readiness, and Startup Probes
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/
kind: docs
primary: true
---

## Summary

Kubernetes' three kinds of probe (docs for Kubernetes 1.37): startup,
liveness (restart the container) and readiness (stop sending it
traffic), the four ways to probe, and the timing defaults.

## Key claims

- Probes either restart containers or stop traffic to them. "Based on the probe results, Kubernetes can restart unhealthy containers or stop sending traffic to containers that are not ready." (intro)
- Liveness failure restarts the container. "Liveness probes determine when to restart a container." (Liveness probe)
- Bad liveness probes can cascade. "Incorrect implementation of liveness probes can lead to cascading failures." (Liveness probe)
- The cascade: restarts under load, failed requests, more work for the rest. "This results in restarting of container under high load; failed client requests as your application became less scalable; and increased workload on remaining pods due to some failed pods." (Liveness probe)
- Readiness failure takes the Pod out of the Service's endpoints. "If the readiness probe returns a failed state, the EndpointSlice controller removes the Pod's IP address from the EndpointSlices of all Services that match the Pod." (Readiness probe)
- Readiness can check dependencies so a Pod that can only return errors gets no traffic. "The liveness probe passes when the app itself is healthy, but the readiness probe additionally checks that each required back-end service is available." (When should you use a readiness probe?)
- A failed readiness probe leaves the container running. "For a failed readiness probe, the kubelet continues running the container that failed checks, and also continues to run more probes" (Configure Probes, failureThreshold)
- An HTTP probe passes on status 200 to 399. "The diagnostic is considered successful if the response has a status code greater than or equal to 200 and less than 400." (Check mechanisms, httpGet)
- A TCP probe passes if the port is open. "The diagnostic is considered successful if the port is open." (Check mechanisms, tcpSocket)
- Defaults: period 10 s, timeout 1 s, failureThreshold 3, successThreshold 1. "Defaults to 3. Minimum value is 1." (Configure Probes, failureThreshold); "Default to 10 seconds." (periodSeconds); "Defaults to 1 second." (timeoutSeconds)
- Readiness is considered failed before the initial delay. "For readiness probes specifically, the result is considered Failure before the initial delay." (Probe outcome)
- Liveness is for a stuck process. "For example, liveness probes could catch a deadlock, where an application is running, but unable to make progress." (Liveness probe)

## Visuals worth redrawing

None.

## My notes

- Readiness is the load-balancing health check; liveness is a
  restart policy. People mix them up.
