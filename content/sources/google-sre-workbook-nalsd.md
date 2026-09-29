---
id: google-sre-workbook-nalsd
title: "The Site Reliability Workbook, chapter 12: Introducing Non-Abstract Large System Design"
author: Salim Virji, James Youngman, Henry Robertson, Stephen Thorne, Dave Rensin and Zoltan Egyed, with Richard Bondi, Google
url: https://sre.google/workbook/non-abstract-design/
kind: book
primary: true
---

## Summary

Google's chapter (2018) on how its SREs design large systems: start from
the problem and requirements, invent a design that works in principle,
then scale it up with real numbers for disks, RAM, network and machines,
and ask whether it survives failures. It works one example all the way
through: a dashboard of click-through rates for AdWords ads, from one
machine to a sharded, multi-datacenter design.

## Key claims

- The process: problem, requirements, then designs that get more sophisticated each round. "we begin with the problem statement, gather requirements, and iterate through designs that become increasingly sophisticated until we reach a viable solution." (What Is NALSD?)
- Why non-abstract: whiteboard designs have to be turned into concrete resource estimates. "the people designing distributed systems need to develop and continuously exercise the muscle of turning a whiteboard design into concrete estimates of resources at multiple steps in the process." (Why "Non-Abstract"?)
- Reasoning matters more than the final numbers. "examples of sound reasoning and assumption making are more important than any final values." (Why "Non-Abstract"?)
- Imperfect assumptions are fine. "The value of this exercise is in combining many imperfect-but-reasonable results into a better understanding of the design." (Why "Non-Abstract"?)
- Two phases: a basic design (is it possible? can we do better?), then scaling it (is it feasible? is it resilient? can we do better?). "In broad strokes, the NALSD process has two phases, each with two to three questions." (Design Process)
- In practice the questions are revisited out of order. "in practice, we bounce around between the questions and phases." (Design Process)
- A design that passes some phases can fail later, and you start again. "One design may successfully pass most of the phases, only to flounder later." (Design Process)
- Requirements written as SLOs: 99.9% of dashboard queries under 1 second, and 99.9% of the time the data is under 5 minutes old; 500,000 search queries and 10,000 ad clicks per second. "let’s assume 500,000 search queries per second and 10,000 ad clicks per second." (Initial Requirements)
- Round up aggressively: each query log entry treated as 2 KB. "we aggressively round up to treat each query log entry as 2 KB." (One Machine, Calculations)
- Scientific notation limits arithmetic mistakes. "we can use scientific notation to limit errors caused by arithmetic on inconsistent units." (One Machine, Calculations)
- The storage estimate: 5 × 10⁵ queries/s × 8.64 × 10⁴ s/day × 2 × 10³ bytes = 86.4 TB/day, rounded up to 100 TB. (One Machine, Calculations)
- Disk operations, not space, rule out one machine: with 200 IOPS per HDD, one write per entry needs 2,500 disks. "(5 × 10⁵ queries/sec) / (200 IOPS/disk) = 2.5 × 10³ disks or 2,500 disks" (One Machine, Calculations)
- Holding 100 TB in RAM on 64 GB machines needs 1,563 machines. "(100 TB) / (64 GB RAM/machine) = 1,563 machines" (One Machine, Calculations)
- Asking what happens when a part fails finds single points of failure. "If we test our design by asking what happens when this component fails, we identify a long list of single points of failure" (One Machine, Evaluation)
- The failed design still taught something. "our one-machine design once again looks unfeasible, but this step hasn’t been a waste of time." (One Machine, Evaluation)
- A batch design (MapReduce) scales but can't meet the 5-minute freshness SLO. "this type of batch process can’t meet our SLO of joined log availability within 5 minutes of logs being received." (MapReduce, Evaluation)
- Scale the bigger stream first: clicks are far fewer than queries. "Intuitively, we need to focus on scaling the larger of the two: query logs." (LogJoiner)
- Shard by hashing a key modulo N. "Hash the record’s query_id." (Sharded LogJoiner, step 1)
- Replication across datacenters with consensus costs a round trip per write; about 25 ms per Paxos operation means 40 sequential operations per second. "we can only perform one operation per 25 milliseconds or 40 operations per second." (Multidatacenter, Calculations)
- The four questions summarised: "Is it possible?", "Can we do better?", "Is it feasible?", "Is it resilient?" (Conclusion)
- Resilience question. "Will it survive occasional but inevitable disruptions?" (Conclusion)
- Components were split by how the system was expected to grow. "we separated software components based on how we expected the system to grow." (Conclusion)
- The one-machine design: an SQL database with indexes, joining the two logs. "On a single machine, using an SQL database with indexes on query_id and search_term should be able to provide answers in under a second." (One Machine)
- Clicks are 2% of queries. "because the average CTR is 2% (10,000 clicks / 500,000 queries), the click log will have 2% as many records as the query log." (One Machine, Calculations)
- One power cycle would break the SLOs. "Almost certainly not—even a simple power cycle would significantly impact our users." (One Machine, Evaluation)
- MapReduce scales by adding machines. "adding more machines will always allow the process to complete successfully without running out of disk space or RAM." (MapReduce, Evaluation)
- Duplicating records to two shards survives a joiner crash. "If our log sharder process sends duplicate log entries to two shards, the system can continue to perform at full speed and process accurate results even when a LogJoiner fails" (Sharded LogJoiner)
- The 25 ms assumes datacenters far apart. "This latency assumption is based upon datacenters at least a few hundred kilometers apart." (Multidatacenter, Calculations)
- Result: 25,500 tasks, about 4 TB of RAM per datacenter, 64 machines at 64 GB. "If we have 64 GB of RAM per machine, we can serve the data from just 64 machines, and will use only 25% of each machine's network bandwidth." (Multidatacenter, Calculations)

## Visuals worth redrawing

- Figures 12-1 to 12-4: the LogJoiner data flow, the sharding, and the
  multidatacenter design. The iteration loop itself isn't drawn; a
  simple loop figure of the questions is our own.

## My notes

- The 200 IOPS per HDD and 64 GB per machine are the chapter's
  assumptions, not measurements. Present them as the example's inputs.
- The chapter's text is licensed CC BY-NC-ND 4.0.
