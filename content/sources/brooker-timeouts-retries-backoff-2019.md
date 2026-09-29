---
id: brooker-timeouts-retries-backoff-2019
title: Timeouts, retries, and backoff with jitter
author: Marc Brooker, Amazon Builders' Library
url: https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf
kind: blog
primary: true
---

## Summary

How Amazon sets timeouts, when it retries, and why it adds backoff and
jitter, written by an AWS engineer (Builders' Library, 2019). Read as
the PDF version; the web page now redirects to builder.aws.com and
renders only with JavaScript.

## Key claims

- A timeout is the longest a client waits for a request. "Timeouts are the maximum amount of time that a client waits for a request to complete." (Failures Happen)
- Slow requests hold resources, and enough of them exhaust the server. "These resources can include memory, threads, connections, ephemeral ports, or anything else that is limited." (Failures Happen)
- Partial and transient failures are why retries work. "A partial failure is when a percentage of requests succeed. A transient failure is when a request fails for a short period of time." (Failures Happen)
- A timeout or failure doesn't mean the side effect didn't happen. "A timeout or failure doesn't necessarily mean that side effects haven't happened." (Failures Happen)
- Jitter is random time before a request or retry. "This is a random amount of time before making or retrying a request to help prevent large bursts by spreading out the arrival rate." (Failures Happen)
- Set a timeout on every remote call, connection and request both. "A best practice in Amazon is to set a timeout on any remote call, and generally on any call across processes even on the same box. This includes both a connection timeout and a request timeout." (Timeouts)
- Too high wastes resources; too low causes retry traffic and can turn a small slowdown into an outage. "Increased small backend latency leading to a complete outage, because all requests start being retried." (Timeouts)
- Pick an acceptable false-timeout rate and read the matching downstream percentile. "we choose an acceptable rate of false timeouts (such as 0.1%). Then, we look at the corresponding latency percentile on the downstream service (p99.9 in this example)." (Timeouts)
- The percentile method is for calls within one AWS Region; over the internet, add worst-case network latency. "A good practice for choosing a timeout for calls within an AWS Region is to start with the latency metrics of the downstream service." / "In these cases, we factor in reasonable worst-case network latency, keeping in mind that clients could span the globe." (Timeouts)
- When p99.9 is close to p50, pad the timeout. "In these cases, adding some padding helps us avoid small latency increases that cause high numbers of timeouts." (Timeouts)
- Prefer the timeouts of well-tested clients. "In general, we prefer to use the timeouts built into well-tested clients." (Timeouts)
- That method fails over the internet and when p99.9 is close to p50. "This approach also doesn’t work with services that have tight latency bounds, where p99.9 is close to p50." (Timeouts)
- SO_RCVTIMEO isn't an end-to-end socket timeout. "Linux's SO_RCVTIMEO is powerful, but has some disadvantages that make it unsuitable as an end-to-end socket timeout." (Timeouts)
- Some timeouts don't cover DNS or TLS handshakes. "There are also implementations where the timeout doesn't cover all remote calls, like DNS or TLS handshakes." (Timeouts)
- Story: a timeout of about 20 ms also covered setting up a new secure connection, so requests timed out after deployments. "Because connection establishment took longer than 20 milliseconds, we saw a small number of requests time out when a new server went into service after deployments." (Timeouts)
- The fix was to open connections at startup, before taking traffic. "Later, we improved the system by establishing these connections when a process started up, but before receiving traffic." (Timeouts)
- Retries are selfish: they spend server time to raise the client's chance. "Retries are “selfish.” In other words, when a client retries, it spends more of the server's time to get a higher chance of success." (Retries and backoff)
- Under overload, retries make it worse and can delay recovery. "They can even delay recovery by keeping the load high long after the original issue is resolved." (Retries and backoff)
- Exponential backoff, capped, and the cap problem. "This is called, predictably, capped exponential backoff. However, this introduces another problem. Now all of the clients are retrying constantly at the capped rate." (Retries and backoff)
- The client usually gives up anyway because of its own timeout. "In most cases, the client is going to give up on the call anyway, because it has its own timeouts." (Retries and backoff)
- Limit the number of retries. "In almost all cases, our solution is to limit the number of times that the client retries, and handle the resulting failure earlier in the service-oriented architecture." (Retries and backoff)
- Five layers with three retries each multiply load on the database 243 times. "If each layer retries independently, the load on the database will increase 243x, making it unlikely to ever recover." (Retries and backoff)
- Retry at one point in the stack. "In general, for low-cost control-plane and data-plane operations, our best practice is to retry at a single point in the stack." (Retries and backoff)
- Circuit breakers add modal behaviour; a local token bucket for retries instead. "We have found that we can mitigate this risk by limiting retries locally using a token bucket." (Retries and backoff)
- The AWS SDK has had that token bucket since 2016. "AWS added this behavior to the AWS SDK in 2016." (Retries and backoff)
- APIs with side effects aren't safe to retry without idempotency. "In general, our view is that APIs with side effects aren't safe to retry unless they provide idempotency." (Retries and backoff)
- Client errors usually shouldn't be retried, server errors may be; eventual consistency blurs this. "A client error one moment may change into a success the next moment as state propagates." (Retries and backoff)
- Backoff alone doesn't help much because failed calls are correlated. "If all the failed calls back off to the same time, they cause contention or overload again when they are retried." (Jitter)
- Jitter belongs on all timers and periodic jobs too. "we consider adding some jitter to all timers, periodic jobs, and other delayed work." (Jitter)
- For scheduled work, jitter per host is chosen consistently, not randomly, so problems repeat in a pattern. "Instead, we use a consistent method that produces the same number every time on the same host." (Jitter)
- (For thundering-herd.) Why consistent jitter: overload happens the same way each time, so people can spot it. "This way, if there is a service being overloaded, or a race condition, it happens the same way in a pattern." (Jitter)
- Retry only while the dependency is healthy. "We avoid this amplification by retrying only when we observe that the dependency is healthy." (Conclusion)

## Visuals worth redrawing

None in the PDF.

## My notes

- The 243 is 3^5: three tries at each of five layers.
- Compare with the SRE book's 64 (4^3) example in google-sre-cascading-failures.
