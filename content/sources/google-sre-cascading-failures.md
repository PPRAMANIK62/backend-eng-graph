---
id: google-sre-cascading-failures
title: "Site Reliability Engineering, chapter 22: Addressing Cascading Failures"
author: Mike Ulrich, Google (Beyer, Jones, Petoff, Murphy, eds.)
url: https://sre.google/sre-book/addressing-cascading-failures/
kind: book
primary: true
---

## Summary

The SRE book (2016) chapter on failures that feed on themselves. Read
for its sections on retries (how naive retries destabilise a backend,
and rules for safe retries) and on deadlines (picking one, missing
them, propagating them, and bimodal latency).

## Key claims

- Late responses waste the server's work and trigger retries. "The work the server did to respond is then wasted, and clients may retry the RPCs, leading to even more overload." (Missed RPC deadlines)
- A naive retry loop: retries grow each second and fewer requests succeed on the first try. "The volume of retries grows: 100 QPS of retries in the first second leads to 200 QPS, then to 300 QPS, and so on." (Retries)
- Retries can keep a backend overloaded; the way out is to cut the load until retries stop. "in order to dig out of this outage, you must dramatically reduce or eliminate the load on the frontends until the retries stop and the backends stabilize." (Retries)
- A backend that can't handle the retries can crash, and its load moves to the other tasks. "it can melt down and crash under the sheer load of requests and retries. This crash then redistributes the requests it was receiving across the remaining backend tasks" (Retries)
- Fixing bad retries usually needs a code push, or cutting load. "you must either fix the retry behavior (usually requiring a code push), reduce load significantly, or cut requests off entirely." (Retries)
- Always use randomized exponential backoff, or retries line up after a blip. "Always use randomized exponential backoff when scheduling retries." (Retries)
- Limit retries per request. "Limit retries per request. Don’t retry a given request indefinitely." (Retries)
- A server-wide retry budget, for example 60 retries a minute per process. "For example, only allow 60 retries per minute in a process, and if the retry budget is exceeded, don’t retry; just fail the request." (Retries)
- Retries at several layers multiply: 3 retries (4 attempts) at three layers is 64 attempts on the database. "then a single user action may create 64 attempts (4^3) on the database." (Retries)
- Separate retriable from non-retriable errors; don't retry permanent errors; send a specific status when overloaded. "Don’t retry permanent errors or malformed requests in a client, because neither will ever succeed." (Retries)
- Bad retry behaviour can look like a symptom rather than a cause. "Graphs of retry rates can be an indication of bad retry behavior, but may be confused as a symptom instead of a compounding cause." (Retries)
- A deadline limits how long the backend can hold the frontend's resources. "RPC deadlines define how long a request can wait before the frontend gives up, limiting the time that the backend may consume the frontend’s resources." (Latency and Deadlines)
- No deadline, or a very high one, lets old problems keep eating resources. "Setting either no deadline or an extremely high deadline may cause short-term problems that have long since passed to continue to consume server resources until the server restarts." (Picking a deadline)
- Short deadlines make expensive requests fail every time; picking one is an art. "Short deadlines can cause some more expensive requests to fail consistently." (Picking a deadline)
- Work done after the client gave up earns nothing. "you don’t get credit for late assignments with RPCs." (Missing deadlines)
- Deadline propagation: every RPC in the tree shares one absolute deadline, e.g. 30 s, then 23 s, then 19 s. "if server A selects a 30-second deadline, and processes the request for 7 seconds before sending an RPC to server B, the RPC from A to B will have a 23-second deadline." (Deadline propagation)
- Bimodal latency example: 1,000 threads, 1,000 QPS at 100 ms; 5% of requests never complete; a 100-second deadline leaves the frontend able to serve 19.6% of requests. "Assuming no other secondary effects, the frontend will only be able to handle 19.6% of the requests (1,000 threads available / (5,000 + 95) threads’ worth of work), resulting in an 80.4% error rate." (Bimodal latency)
- Deadlines orders of magnitude above the mean latency are usually bad. "Having deadlines several orders of magnitude longer than the mean request latency is usually bad." (Bimodal latency)
- Fail fast when a backend is unavailable. "If your RPC layer supports a fail-fast option, use it." (Bimodal latency)
- (For capacity-planning and queueing-theory.) CPU overload makes every request slower, and slower requests pile up. "Because requests take longer to handle, more requests are handled concurrently" (Server Overload, CPU)
- A full queue adds latency: with a queue 10x the thread count and 100 ms per request, a request waits about a second. "If the queue is full, then a request will take 1.1 seconds to handle, most of which time is spent on the queue." (Queue Management)
- Keep queues short for steady traffic. "it is usually better to have small queue lengths relative to the thread pool size (e.g., 50% or less)" (Queue Management)
- Gmail often runs servers with no queue at all and fails over to other tasks when threads are full. "Gmail often uses queueless servers" (Queue Management)
- Capacity planning needs a measured breaking point. "Capacity planning should be coupled with performance testing to determine the load at which the service will fail." (Preventing Server Overload)
- The worked example: breaking point 5,000 QPS per cluster, peak 19,000 QPS, load spread evenly. "then approximately six clusters are needed to run the service at N + 2." (Preventing Server Overload)
- Planning isn't enough on its own. "Capacity planning reduces the probability of triggering a cascading failure, but it is not sufficient to protect the service from cascading failures." (Preventing Server Overload)
- Growth that nobody planned for is a common trigger. "a growth in usage wasn’t accompanied by an adjustment to capacity." (Organic Growth)
- The cost per request drifts. "the average cost to handle an individual payload may have changed due to frontend code or configuration changes." (Request profile changes)
- Borrowed slack CPU isn't capacity. "Depending upon this slack CPU as your safety net is dangerous." (Resource limits)
- Load tests find the number planning needs. "Load testing also reveals where the breaking point is, knowledge that’s fundamental to the capacity planning process." (Test Until Failure and Beyond)
- Each component breaks at its own point. "individual components may have different breaking points, so load test each component separately." (Test Until Failure and Beyond)
- Growing on demand helps but doesn't replace planning. "Some systems can grow the number of tasks for your service on demand, which may prevent overload; however, proper capacity planning is still needed." (Preventing Server Overload)
- Queues cost memory and time. "Queued requests consume memory and increase latency." (Queue Management)
- More requests in flight load almost every resource. "This affects almost all resources, including memory, number of active threads (in a thread-per-request server model), number of file descriptors, and backend resources" (Server Overload, CPU)
- Busier CPUs use their caches worse. "As more CPU is used, the chance of spilling on to more cores increases, resulting in decreased usage of local caches and decreased CPU efficiency." (Server Overload, CPU)
- Load test inside your guaranteed resources. "When performing load tests, make sure that you remain within your committed resource limits." (Resource limits)
- Many cascading failures come from growth alone. "In many cases, a cascading failure isn’t triggered by a specific service change" (Organic Growth)
- (For deadline-propagation.) Example of a request that's already dead: 10-second deadline, 11 seconds to get from the queue to a thread. "Suppose an RPC has a 10-second deadline, as set by the client. The server is very overloaded, and as a result, it takes 11 seconds to move from a queue to a thread pool." (Missing deadlines)
- Check the time left before each stage of a request. "the server should check the deadline left at each stage before attempting to perform any more work on the request." (Missing deadlines)
- Don't invent a deadline for outgoing calls; propagate the incoming one. "Rather than inventing a deadline when sending RPCs to backends, servers should employ deadline propagation." (Deadline propagation)
- The counter-example: A gives B 10 s; B spends 8 s, then calls C with a hard-coded 20 s; C picks it up after 5 s and does useless work. "However, in this scenario, server C processes the request thinking it has 15 seconds to spare, but is not doing useful work, since the request from server A to server B has already exceeded its deadline." (Deadline propagation)
- Shave a little off the outgoing deadline. "You may want to reduce the outgoing deadline a bit (e.g., a few hundred milliseconds) to account for network transit times and post-processing in the client." (Deadline propagation)
- Consider a cap on outgoing deadlines, carefully. "Also consider setting an upper bound for outgoing deadlines." (Deadline propagation)
- Exception: checkpointed catch-up work can check the deadline after the checkpoint. "it would be a good idea to check the deadline only after writing the checkpoint, instead of after the expensive operation." (Deadline propagation)
- Cancellation propagation tells the whole tree to stop. "Propagating cancellations reduces unneeded or doomed work by advising servers in an RPC call stack that their efforts are no longer necessary." (Cancellation propagation)
- Deadlines alone leak work when a deeper call fails for good; send the error up and cancel the rest. "Sending fatal errors or timeouts up the stack and cancelling other RPCs in the call tree prevents unneeded work if the request as a whole can't be fulfilled." (Cancellation propagation)
- LIFO or CoDel queues pair well with propagated deadlines. "This strategy works well when combined with propagating RPC deadlines throughout the stack, described in Latency and Deadlines." (Load Shedding and Graceful Degradation)
- The request profile drifts: traffic shifts between clusters, code changes the cost, users store more and bigger data. "both the number and size of images, per user, for a photo storage service tend to increase over time." (Request profile changes)
- What planning can't cover. "Load balancing problems, network partitions, or unexpected traffic increases can create pockets of high load beyond what was planned." (Preventing Server Overload)
- (For cascading-failures, load-shedding, graceful-degradation.) Definition: a failure that grows through positive feedback. "A cascading failure is a failure that grows over time as a result of positive feedback." (intro)
- The domino example: one replica fails, the others get its load. "For example, a single replica for a service can fail due to overload, increasing load on remaining replicas and increasing their probability of failing, causing a domino effect that takes down all the replicas for a service." (intro)
- Overload is the most common cause. "The most common cause of cascading failures is overload." (Server Overload)
- Cluster example: B fails, A goes from 1,000 to 1,200 QPS and its successful rate dips well below 1,000. "As a result, the rate of successfully handled requests in A dips well below 1,000 QPS." (Server Overload)
- It can spread globally within minutes, because load balancers act fast. "It may not take long for these events to transpire (e.g., on the order of a couple minutes), because the load balancer and task scheduling systems involved may act very quickly." (Server Overload)
- Running out of a resource is supposed to cause errors or slowness; something has to give. "These are in fact desired effects of running out of resources: something eventually needs to give as the load increases beyond what a server can handle." (Resource Exhaustion)
- The GC death spiral: less CPU, slower requests, more RAM, more GC. "This is known colloquially as the “GC death spiral.”" (Memory)
- Less memory means fewer cache hits and more calls to backends. "Reduction in available RAM can reduce application-level cache hit rates, resulting in more RPCs to the backends, which can possibly cause the backends to become overloaded." (Memory)
- Secondary symptoms look like the root cause. "a service experiencing overload often has a host of secondary symptoms that can look like the root cause, making debugging difficult." (Dependencies among resources)
- The cause is hard to see across teams. "It might be very hard to determine that the backend crash was caused by a decrease in the cache rate in the frontend, particularly if the frontend and backend components have different owners." (Dependencies among resources)
- Once servers crash-loop, restarted ones are hit at once and fail. "It’s often difficult to escape this scenario because as soon as servers come back online they’re bombarded with an extremely high rate of requests and fail almost immediately." (Service Unavailability)
- Healthy at 10,000 QPS, cascade at 11,000, and dropping to 9,000 won't stop it; with 10% of servers healthy, load must drop to about 1,000. "if 10% of the servers are healthy enough to handle requests, the request rate would need to drop to about 1,000 QPS in order for the system to stabilize and recover." (Service Unavailability)
- Balancers that avoid servers with errors make it worse. "Load balancing policies that avoid servers that have served errors can exacerbate problems further" (Service Unavailability)
- Load shedding: drop some traffic near overload while doing as much useful work as possible. "The goal is to keep the server from running out of RAM, failing health checks, serving with extremely high latency, or any of the other symptoms associated with overload, while still doing as much useful work as it can." (Load Shedding and Graceful Degradation)
- One simple form: 503 when too many requests are in flight. "one effective approach is to return an HTTP 503 (service unavailable) to any incoming request when there are more than a given number of client requests in flight." (Load Shedding and Graceful Degradation)
- LIFO or CoDel drops requests no longer worth doing. "Changing the queuing method from the standard first-in, first-out (FIFO) to last-in, first-out (LIFO) or using the controlled delay (CoDel) algorithm [Nic12] or similar approaches can reduce load by removing requests that are unlikely to be worth processing [Mau15]." (Load Shedding and Graceful Degradation)
- Graceful degradation reduces the work itself. "Graceful degradation takes the concept of load shedding one step further by reducing the amount of work that needs to be performed." (Load Shedding and Graceful Degradation)
- Example: search a subset in memory, or rank less accurately. "a search application might only search a subset of data stored in an in-memory cache rather than the full on-disk database or use a less-accurate (but faster) ranking algorithm when overloaded." (Load Shedding and Graceful Degradation)
- It shouldn't trigger often. "Graceful degradation shouldn’t trigger very often—usually in cases of a capacity planning failure or unexpected load shift." (Load Shedding and Graceful Degradation)
- Unused code paths break; exercise degraded mode on a few servers. "Remember that the code path you never use is the code path that (often) doesn’t work." / "You can make sure that graceful degradation stays working by regularly running a small subset of servers near overload in order to exercise this code path." (Load Shedding and Graceful Degradation)
- Alert when many servers degrade; keep a quick off switch. "Monitor and alert when too many servers enter these modes." / "Design a way to quickly turn off complex graceful degradation or tune parameters if needed." (Load Shedding and Graceful Degradation)
- Rate limiting often ignores service health. "Note that because rate limiting often doesn’t take overall service health into account, it may not be able to stop a failure that has already begun." (Preventing Server Overload)
- Warm-up: new or restarted processes and cold caches are slow. "Processes are often slower at responding to requests immediately after starting than they will be in steady state." (Slow Startup and Cold Caching)
- Latency cache vs capacity cache. "when a latency cache is employed, the service can sustain its expected load with an empty cache, but a service using a capacity cache cannot sustain its expected load under an empty cache." (Slow Startup and Cold Caching)
- Intra-layer calls can spread thread-pool saturation. "This behavior can cause the thread pool saturation to spread." (Always Go Downward in the Stack)
- Triggers: process death, updates, rollouts, organic growth, drains, request profile changes, resource limits. "A very small event (e.g., a couple of crashes or tasks rescheduled to other machines) may cause a service on the brink of falling to break." (Process Death)
- A good component serves errors past its limit but keeps its success rate. "At this point, the component should ideally start serving errors or degraded results in response to additional load, but not significantly reduce the rate at which it successfully handles requests." (Test Until Failure and Beyond)
- A fragile one crashes; a better one rejects a few and survives. "a better designed component will instead be able to reject a few requests and survive." (Test Until Failure and Beyond)
- Test the way back down too. "If a couple of servers crash under heavy load, how much does the load need to drop in order for the system to stabilize?" (Test Until Failure and Beyond)
- Noncritical backends that blackhole can still hurt frontends with long deadlines. "Backends advertised as noncritical can still cause problems on frontends when requests have long deadlines." (Test Noncritical Backends)
- Adding tasks may not help once in a death spiral. "However, if the service has entered a death spiral of some sort, adding more resources may not be sufficient to recover." (Increase Resources)
- Health checks can make things worse; separate process health from service health. "This practice may create a failure mode in which health-checking itself makes the service unhealthy." (Stop Health Check Failures/Deaths)
- Drop traffic hard (say to 1%), let servers recover, ramp back up. "Consider being aggressive here—if the entire service is crash-looping, only allow, say, 1% of the traffic through." (Drop Traffic)
- Fix the trigger first, or it recurs. "If the issue that started the cascading failure is not fixed (e.g., insufficient global capacity), then the cascading failure may trigger shortly after all traffic returns." (Drop Traffic)
- Degraded modes must be built in advance. "This strategy must be engineered into your service, and can be implemented only if you know which traffic can be degraded and you have the ability to differentiate between the various payloads." (Enter Degraded Modes)
- Shakespeare example: under scarce capacity the service stops returning pictures and maps. "As capacity becomes scarce, the service no longer returns pictures alongside text or small maps illustrating where a story takes place." (Cascading Failure and Shakespeare)
- Pictures that time out aren't retried. "an RPC that times out is either not retried (for example, in the case of the aforementioned pictures), or is retried with a randomized exponential backoff." (Cascading Failure and Shakespeare)
- Complex degradation can misfire. "excessive complexity may cause the server to trip into a degraded mode when it is not desired, or enter feedback cycles at undesired times." (Load Shedding and Graceful Degradation)
- Normal-case improvements raise the risk of big failures. "Retrying on failures, shifting load around from unhealthy servers, killing unhealthy servers, adding caches to improve performance or reduce latency: all of these might be implemented to improve the normal case, but can improve the chance of causing a large-scale failure." (Closing Remarks)
- Shakespeare example trigger: a documentary on TV sends traffic to the service. "A documentary about Shakespeare’s works airs in Japan, and explicitly points to our Shakespeare service as an excellent place to conduct further research." (Cascading Failure and Shakespeare)
- The GC example as a chain: GC eats CPU, requests slow, more in flight, less RAM for cache, more misses to the backend, backend health checks fail. "The reduced cache size means fewer entries in the cache, in addition to a lower hit rate. The increase in cache misses means that more requests fall through to the backend for servicing." (Dependencies among resources)
- Query of death as a cause of process death. "Tasks might die because of a Query of Death (an RPC whose contents trigger a failure in the process), cluster issues, assertion failures, or a number of other reasons." (Process Death)
- Turn off important but non-critical load during an outage. "if index updates, data copies, or statistics gathering consume resources of the serving path, consider turning off those sources of load during an outage." (Eliminate Batch Load)
- Instead of backends proxying to each other, have the client make the call. "Instead, have the client do the communication." (Always Go Downward in the Stack)

## Visuals worth redrawing

- The deadline propagation example (30 s, 23 s, 19 s) as a shrinking
  budget down a call chain. Phase 13's deadline-propagation node.

## My notes

- The 19.6% is arithmetic on a made-up example, not a measurement.
