---
id: netflix-hystrix-readme
title: Hystrix README
author: Netflix (Hystrix authors)
url: https://github.com/Netflix/Hystrix
kind: code
primary: true
---

## Summary

The front page of the Hystrix repository. Read for its status note:
Hystrix is in maintenance mode, and Netflix moved to adaptive
approaches and recommends resilience4j for new work.

## Key claims

- Hystrix is no longer developed. "Hystrix is no longer in active development, and is currently in maintenance mode." (status note)
- Netflix moved to adaptive limits instead of preset thresholds. "Meanwhile, our focus has shifted towards more adaptive implementations that react to an application’s real time performance rather than pre-configured settings (for example, through adaptive concurrency limits)." (status note)
- It recommends resilience4j for new projects. "For the cases where something like Hystrix makes sense, we intend to continue using Hystrix for existing applications, and to leverage open and active projects like resilience4j for new internal projects." (status note)
- The last release is 1.5.18. "We have made a final release of Hystrix (1.5.18) per issue 1891 so that the latest version in Maven Central is aligned with the last known stable version used internally at Netflix (1.5.11)." (status note)
- What Hystrix was for. "Hystrix is a latency and fault tolerance library designed to isolate points of access to remote systems, services and 3rd party libraries, stop cascading failure and enable resilience in complex distributed systems where failure is inevitable." (Introduction)

## Visuals worth redrawing

None.

## My notes

- Adaptive concurrency limits belong to `admission-control`.
