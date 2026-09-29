---
id: akka-phi-accrual-failure-detector
title: Phi Accrual Failure Detector (Akka core documentation)
author: Akka (Lightbend)
url: https://doc.akka.io/libraries/akka-core/current/typed/failure-detector.html
kind: docs
primary: true
---

## Summary

The Akka core docs page (version 2.10.22 when read) on how Akka Cluster
detects unreachable nodes: request/reply heartbeats every second, fed into
a φ accrual failure detector, with a threshold and an
acceptable-heartbeat-pause margin to ride out GC pauses.

## Key claims

- Akka uses the φ accrual detector of Hayashibara et al. "The heartbeat arrival times are interpreted by an implementation of The Phi Accrual Failure Detector by Hayashibara et al." (Introduction)
- Heartbeats go out every second by default, as request and reply. "Heartbeats are sent every second by default, which is configurable." (Failure Detector Heartbeats)
- The formula. "phi = -log10(1 - F(timeSinceLastHeartbeat))" (Failure Detector Heartbeats)
- F is a normal distribution fitted to past inter-arrival times. "where F is the cumulative distribution function of a normal distribution with mean and standard deviation estimated from historical heartbeat inter-arrival times." (Failure Detector Heartbeats)
- It answers with a likelihood, not yes or no. "Rather than only answering “yes” or “no” to the question “is the node down?” it returns a phi value representing the likelihood that the node is down." (Failure Detector Heartbeats)
- Steadier heartbeats make the curve steeper, so failures are detected faster. "If the heartbeats arrive with less deviation the curve becomes steeper, i.e. it is possible to determine failure more quickly." (Failure Detector Heartbeats)
- A margin absorbs GC pauses and brief network trouble. "To be able to survive sudden abnormalities, such as garbage collection pauses and transient network failures the failure detector is configured with a margin" (Failure Detector Heartbeats)
- Flapping between UNREACHABLE and REACHABLE is the sign of false positives; look for GC pauses, overload or CPU quotas before raising the margin. "If you see false positives, as indicated by frequent UNREACHABLE followed by REACHABLE logging, you can increase the acceptable-heartbeat-pause" (Logging)
- Before raising the margin, check the cause. "it can be good to investigate the reason so that it is not caused by long (unexpected) garbage collection pauses, overloading the system, too restrictive CPU quotas settings, and similar." (Logging)
- Example setting shown on the page. "akka.cluster.failure-detector.acceptable-heartbeat-pause = 7s" (Logging)
- Default threshold 8; 12 suggested for EC2. "The default threshold is 8 and is appropriate for most situations." (Failure Detector Threshold)
- "However in cloud environments, such as Amazon EC2, the value could be increased to 12 in order to account for network issues that sometimes occur on such platforms." (Failure Detector Threshold)

## Visuals worth redrawing

- The charts of φ against time since the last heartbeat, for standard
  deviations of 200 ms and 100 ms, and with a 3 s acceptable pause.

## My notes

- The page doesn't give the default acceptable-heartbeat-pause; the 7s
  value is only an example in the text.
