---
id: gregg-use-method
title: The USE Method
author: Brendan Gregg
url: https://www.brendangregg.com/usemethod.html
kind: blog
primary: true
---

## Summary

Brendan Gregg's page defining the USE method, which he created: for every
resource, check utilization, saturation and errors. It gives the
definitions, a generic resource list for servers, example metrics, how to
read them, how to treat software resources and cloud limits, and how USE
compares with a tools-first approach. Also published in ACM Queue as
"Thinking Methodically about Performance" (2012).

## Key claims

- The whole method in one line. "For every resource, check utilization, saturation, and errors." (Summary)
- It starts from questions, not from whatever metrics you happen to have. "It begins by posing questions, and then seeks answers, instead of beginning with given metrics (partial answers) and trying to work backwards." (intro)
- It's meant for early in an investigation. "It's intended to be used early in a performance investigation, to identify systemic bottlenecks." (Summary)
- Utilization definition (busy time). "utilization: the average time that the resource was busy servicing work" (Summary, terminology)
- A second definition of utilization exists (capacity used), where 100% means nothing more fits. "There is another definition where utilization describes the proportion of a resource that is used, and so 100% utilization means no more work can be accepted" (Summary, footnote 2)
- Saturation definition. "saturation: the degree to which the resource has extra work which it can't service, often queued" (Summary, terminology)
- Errors definition. "errors: the count of error events" (Summary, terminology)
- Usual units: utilization as a percent over an interval, saturation as a queue length, errors as counts. "saturation: as a queue length." (Summary, metric terms; the example given is an average CPU run-queue length of four)
- Errors matter even when recovered from, because retries and failed pool members cost performance. "This includes operations that fail and are retried, and devices from a pool of redundant devices that fail." (Summary)
- Averages over long intervals hide bursts. "A burst of high utilization can cause saturation and performance issues, even though utilization is low when averaged over a long interval." (Does Low Utilization Mean No Saturation?)
- His example: 5-minute averages never above 80% hid seconds at 100%. "The monitoring tool was reporting five minute averages, during which CPU utilization hit 100% for seconds at a time." (Does Low Utilization Mean No Saturation?)
- Generic server resource list: CPUs, memory capacity, network interfaces, storage devices, controllers, interconnects. (Resource List)
- Caches are left out because they help under high utilization; check them after. "Caches improve performance under high utilization." (Resource List)
- Example metrics: CPU saturation is run-queue length or scheduler latency; memory saturation is anonymous paging or swapping; network saturation is drops and overruns; storage saturation is wait queue length. (Metrics, Harder Metrics tables)
- Doing every combination gives about thirty metrics; the easy ones find most issues. "You'll end up with a list of about thirty metrics, some of which can't be measured, and some of which are tricky to measure." (Harder Metrics)
- Unchecked items become known unknowns. "what were once unknown-unknowns are now known-unknowns." (In Practice)
- Software resources work too: mutex locks (held time, threads queued), thread pools (busy time, requests waiting), process/thread and file descriptor limits (errors when allocation fails). (Software Resources)
- Interpretation: 100% is usually a bottleneck; above about 70% can start to hurt, partly because averages hide bursts. "High utilization (eg, beyond 70%) can begin to be a problem for a couple of reasons" (Suggested Interpretations)
- Any saturation is a potential problem. "Saturation: any degree of saturation can be a problem (non-zero)." (Suggested Interpretations)
- A clean result is useful because it narrows the search. "It's easy to interpret the negative case: low utilization, no saturation, no errors." (Suggested Interpretations)
- Cloud and container limits (cgroups, hypervisor caps) are resources too; a tenant's memory use against its cap is its utilization. "This can include hypervisor or container (cgroup) limits for memory, CPU, network, and storage I/O." (Cloud Computing)
- Check errors first, as they're quick. "Note that errors can be checked before utilization and saturation, as a minor optimization (they are usually quicker and easier to interpret)." (Strategy)
- The first problem found may not be the problem. "the first one you find may be a problem but not the problem." (Strategy)
- His own estimate of coverage (a claim, not a measurement). "I find it solves about 80% of server issues with 5% of the effort" (Intro)
- Latency-based methods can find more but take longer and need software knowledge. "While the USE Method may find 80% of server issues, latency-based methodologies (eg, Method R) can approach finding 100% of all issues." (Other Methodologies)
- It only finds one class of problem. "It will, however, only find certain types of issues – bottlenecks and errors – and should be considered as one tool in a larger toolbox." (Conclusion)
- The tools-first anti-pattern: you only see what your tools show. "The user is also unaware that they have an incomplete view - and so the problem will remain." (Tools Method)
- The second reason 70% can hurt: some devices can't be interrupted mid-operation. "Some system resources, such as hard disks, cannot be interrupted during an operation, even for higher-priority work." (Suggested Interpretations)
- The common issues show up in the easy metrics. "Fortunately, the most common issues are usually found with the easy ones (eg, CPU saturation, memory capacity saturation, network interface utilization, disk utilization), which can be checked first." (Harder Metrics)
- Process and thread limits: failed allocation is the error. "errors are when the allocation failed" (Software Resources; the example given is 'cannot fork')
- Network interface utilization is throughput against the maximum. "RX/TX throughput / max bandwidth" (Metrics table, network interface utilization)

## Visuals worth redrawing

- The USE flowchart (Strategy): pick a resource, check errors, utilization,
  saturation, investigate any hit, else move to the next resource.
- The resource-by-metric table (Metrics).

## My notes

- The 80% figure is the author's own estimate, not a measurement. If used,
  say so.
- The page was last updated in 2017; the Linux checklist it links uses
  older tools (ifconfig, dstat). Pressure stall information (kernel-psi)
  is a newer direct saturation signal the page doesn't mention.
