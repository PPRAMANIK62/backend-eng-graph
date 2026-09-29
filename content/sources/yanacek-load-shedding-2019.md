---
id: yanacek-load-shedding-2019
title: Using load shedding to avoid overload
author: David Yanacek, Amazon Builders' Library
url: https://d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf
kind: blog
primary: true
---

## Summary

How Amazon services protect themselves when offered more work than they
can do (Builders' Library, 2019). Defines goodput against throughput,
explains why overload feeds itself (timeouts waste work, retries add
load), and lists the mechanisms Amazon uses: rejecting early, cheap
rejections, priorities, per-request deadlines, bounded queue time, LIFO,
and shedding in layers. Read as the PDF; the web page now redirects to
builder.aws.com and renders only with JavaScript.

## Key claims

- Latency rises with load and then hits an inflection point. "Eventually, services reach an inflection point where their performance starts degrading even more rapidly." (The anatomy of overload)
- What grows under heavy load. "Under heavy load, thread contention, context switching, garbage collection, and I/O contention become more pronounced." (The anatomy of overload)
- A late reply counts as success on the server and as an error at the client. "From the server’s perspective, it has returned a successful response. But from the perspective of the client that timed out, it was an error." (Keeping an eye on the clock)
- Measure what the client sees, not just the server. "we make sure to measure client-perceived availability and latency in addition to" server-side availability and latency (Testing)
- If shedding works, goodput holds as load grows. "If load shedding is working, goodput will remain steady even as offered throughput increases well beyond the scaled capabilities of the service." (Testing)
- Throughput doesn't just stop growing past capacity, it falls. "Unfortunately, not only is throughput bounded by a system’s resources, throughput typically degrades when the system is overloaded." (The anatomy of overload)
- Overloaded computers keep taking work but become too slow to be useful. "Computers take on work even when they’re overloaded, but they spend increasing amounts of their time context switching and become too slow to be useful." (The anatomy of overload)
- When latency passes the client's timeout, requests fail. "When a server gets so overloaded that its latency exceeds its client’s timeout, requests start to fail." (The anatomy of overload)
- Median latency equal to the client timeout means 50% availability. "If the service's median latency is equal to the client timeout, half of the requests are timing out, so the availability is 50 percent." (The anatomy of overload)
- Throughput is everything sent; goodput is what's handled without errors and fast enough to use. "Throughput is the total number of requests per second that is being sent to the server. Goodput is the subset of the throughput that is handled without errors and with low enough latency for the client to make use of the response." (The anatomy of overload)
- A timed-out request wastes the server's work. "What’s even worse is that all the progress that the server made so far on that request goes to waste." (Positive feedback loops)
- Retries multiply offered load, and layered retries amplify it exponentially. "an overload in the bottom layer causes cascading retries that amplify the offered load exponentially." (Positive feedback loops)
- Together these make overload a steady state. "When these factors are combined, an overload creates its own feedback loop that results in overload as a steady state." (Positive feedback loops)
- Load shedding: reject the excess so accepted requests stay fast. "When a server approaches overload, it should start rejecting excess requests so that it can focus on the requests it decides to let in." (Preventing work from going to waste)
- The goal is latency low enough to answer before the client times out. "The goal of load shedding is to keep latency low for the requests that the server decides to accept so that the service replies before the client times out." (Preventing work from going to waste)
- Only the excess traffic loses availability. "the server maintains high availability for the requests it accepts, and only the excess traffic’s availability is affected." (Preventing work from going to waste)
- Shedding isn't free, so eventually goodput drops anyway. "However, the act of shedding load isn’t free, so eventually the server falls prey to Amdahl’s law and goodput drops." (Preventing work from going to waste)
- Load test past the breaking point, or assume the worst failure. "they should assume that the service will fail in the least desirable way possible." (Testing)
- The ideal overload test: goodput plateaus and stays flat. "The ideal load test result is for goodput to plateau when the service is close to being fully utilized, and to remain flat even when more throughput is applied." (Testing)
- Testing by removing servers under steady load raises per-instance load. "This technique of artificially increasing load by decreasing fleet sizes is useful for testing a service in isolation, but it isn’t a complete substitute for full load tests." (Testing)
- Keep the false positive rate (rejecting while there's capacity) at zero. "We strive to keep a service’s false positive rate at zero." (Visibility)
- Log who was rejected and alarm on significant rejection. "we make sure that we have proper instrumentation to know who the client was, which operation they were calling" (Visibility)
- Fast failures pollute latency metrics. "if a service is load shedding 60 percent of its traffic, the service's median latency might look pretty amazing even if its successful request latency is terrible" (Visibility)
- Shedding at the same CPU target as autoscaling can stop autoscaling from ever triggering. "the load shedding system will reduce the number of requests to keep the CPU load low, and reactive scaling will never receive or get a delayed signal to launch new instances." (Load shedding effects on automatic scaling)
- With shedding, the fleet may run closer to its rejection point than CPU shows. "with load shedding, a fleet might run much closer to the point at which requests would be rejected than system metrics indicate" (Load shedding effects on automatic scaling)
- Causes of overload listed: surges, lost capacity, requests getting more expensive. "clients shifting from making cheap requests (like cached reads) to expensive requests (like cache misses or writes)." (Load shedding mechanisms)
- Dropping must be cheap; an accidental log line can make it expensive. "it’s easy to miss an accidental log statement or a socket setting, which might make dropping a request far more expensive than it needs to be." (Understanding the cost of dropping requests)
- Rarely, a quick rejection costs more than holding the request, so rejections are slowed. "In rare cases, quickly dropping a request can be more expensive than holding on to the request." (Understanding the cost of dropping requests)
- The most important request is the load balancer's ping. "The most important request that a server will receive is a ping request from a load balancer." (Prioritizing requests)
- Failing pings shrinks the fleet in a brownout. "And in a brownout scenario, the last thing we want to do is to reduce the size of our fleets." (Prioritizing requests)
- Crawler traffic is less critical than human traffic. "A service call that supports web page rendering for a search index crawler is likely to be less critical to serve than a request that originates from a human." (Prioritizing requests)
- Over-quota bursts get lower priority than within-quota requests. "the excess requests from these clients might be prioritized lower than within-quota requests from other clients." (Prioritizing requests)
- Clients send timeout hints so servers can drop doomed requests. "The server can evaluate these hints and drop doomed requests at little cost." (Keeping an eye on the clock)
- Requests can wait in TCP buffers until the client has already timed out. "huge volumes of requests can queue up in Transmission Control Protocol (TCP) buffers, so by the time the server reads the requests from its buffers, the client has already timed out." (Keeping an eye on the clock)
- The remaining deadline is propagated between hops. "we propagate the “remaining time” deadline between each hop" (Keeping an eye on the clock)
- Prioritise finishing started work: end() over start(), later pages over first pages. "In this case, the service should prioritize end() requests over start() requests." (Finishing what was started)
- Admission control is hard without bounded work per request. "It’s very difficult to perform admission control when a server has no idea what it will take to process a request." (Finishing what was started)
- Bound how long a request sits in a queue, and throw it out if too old. "we’ve found it’s extremely important to place an upper bound on the amount of time that an incoming request sits on a queue, and we throw it out if it's too old." (Watching out for queues)
- LIFO where the protocol allows. "As an extreme version of this approach, we look for ways to use a last in, first out (LIFO) queue instead" (Watching out for queues)
- Load balancer surge queues cause brownouts; spillover fast-fails instead. "A generally safe default is to use a spillover configuration, which fast-fails instead of queueing excess requests." (Watching out for queues)
- ELB changed: the Classic Load Balancer queued, the Application Load Balancer rejects. "The Classic Load Balancer used a surge queue, but the Application Load Balancer rejects excess traffic." (Watching out for queues)
- Assume there are queues you don't know about. "I find that it’s helpful to assume there are queues somewhere that I don’t know about yet." (Watching out for queues)
- Proxy connection caps (NGINX max_conns) are a last resort; in-flight counts can mislead. "raw in-flight request count tracking sometimes provides inaccurate information about whether a service is actually overloaded." (Protecting against overload in lower layers)
- iptables can reject excess connections more cheaply than any server process. "can reject excess connections far more cheaply than any server process." (Protecting against overload in lower layers)
- Early rejection is cheapest but costs visibility, hence layers. "Early rejection is important because it’s the cheapest place to drop excess traffic, but it comes at a cost to visibility." (Protecting in layers)
- The overload loop is driven by latency. "The overload feedback loop is driven by latency, which ultimately causes wasted work, request rate amplification, and even more overload." (Thinking about overload differently)
- Regular false positives point to tuning, scaling or balancing problems. "If a team finds that their service’s false positive rate is non-zero on a regular basis, the service is either tuned too sensitively, or individual hosts are being constantly and legitimately overloaded, and there may be a scaling or load balancing problem." (Visibility)
- Layers: the server drops what it can and logs it; the layer in front handles extreme volumes. "Since there is only so much traffic a server can drop, we rely on the layer in front of it to protect it from extreme volumes of traffic." (Protecting in layers)
- API Gateway can cap request rates; WAF can shed traffic in front of API Gateway, ALB or CloudFront. "When we front a service with Amazon API Gateway, we can configure a maximum request rate that any API will accept." (Protecting in layers)

## Visuals worth redrawing

- Page 4: "Goodput vs. throughput": goodput rises with offered load, peaks
  ("The maximum effective throughput is reached") then collapses to zero
  ("The more work the system takes on, the less it gets done"). Redraw as
  a schematic, no numbers.
- Page 4 and 5: availability and median latency vs throughput, without
  and with load shedding (availability drops to 0% without; accepted
  request availability stays at 100% with).

## My notes

- The graphs are illustrations, not a named benchmark; don't quote their
  axis values.
