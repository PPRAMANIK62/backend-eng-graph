---
id: azure-bulkhead-pattern
title: Bulkhead pattern (Azure Architecture Center)
author: Microsoft
url: https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead
kind: docs
primary: false
---

## Summary

Microsoft's write-up of the bulkhead pattern: split resources into
pools so one failing dependency or one noisy consumer can use up only
its own pool. Covers both sides: a client with a pool per dependency,
and a service with instances per group of consumers.

## Key claims

- The idea: isolate parts into pools so a failure in one leaves the others working. "Isolate the elements of an application into pools so that if one element fails, the others continue to function." (opening)
- It equates the pattern with cell-based architecture. "This approach, also known as a cell-based architecture, makes an application tolerant of failure and stops a fault in one part of the system from cascading across the rest." (opening)
- The name comes from a ship's hull. "This pattern is named after the sectioned partitions (bulkheads) of a ship's hull." (Tip)
- The failure it prevents: one unresponsive service exhausts the client's shared connection pool, and calls to every other service fail too. "Eventually, the consumer can't send requests to any other services, not only the original unresponsive service." (Context and problem)
- Client side: a connection pool per service. "For example, a consumer that calls multiple services might be assigned a connection pool for each service." (Solution)
- Service side: partition instances by consumer. "Partition service instances into different groups based on consumer load and availability requirements." (Solution)
- Pools can give different quality of service to different consumers. "You can configure a high-priority consumer pool to use high-priority services." (Solution)
- Consumer bulkheads can be processes, thread pools or semaphores. "When you partition consumers into bulkheads, consider using processes, thread pools, and semaphores." (Problems and considerations)
- Combine with retries, breakers and throttling. "To provide more sophisticated fault handling, consider combining bulkheads with retry, circuit breaker, and throttling patterns." (Problems and considerations)
- Async systems can isolate with separate queues. "Services that communicate by using asynchronous messages can be isolated through different sets of queues." (Problems and considerations)
- The cost: less efficient use of resources. "Less efficient use of resources might not be acceptable in the project." (When to use this pattern)

## Visuals worth redrawing

- Workloads with a connection pool per service; Service A's pool is
  isolated when A fails.

## My notes

- "Also known as a cell-based architecture" is looser than how the
  graph uses cells (whole copies of a service). Worth a compare link.
