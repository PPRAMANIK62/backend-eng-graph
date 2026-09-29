---
id: aws-availability-and-beyond
title: "Availability and Beyond: Understanding and Improving the Resilience of Distributed Systems on AWS"
author: Michael Haken (AWS)
url: https://docs.aws.amazon.com/whitepapers/latest/availability-and-beyond-improving-resilience/understanding-availability.html
kind: docs
primary: true
---

## Summary

AWS whitepaper (2021), now marked "for historical reference only". The
"Understanding availability" section and its subpages were read:
availability from MTBF and MTTR, availability with hard dependencies
(multiply them), with redundant spares (multiply the failure
probabilities), diminishing returns from spares, the unit of failure,
and fault tolerance vs fault isolation.

## Key claims

- Availability is uptime over total time. "We define availability, *A*, as the percentage of time that a workload is available for use." (Understanding availability)
- A = MTBF / (MTBF + MTTR), and MTTD is part of MTTR. "An important period of time in the MTTR is the *mean time to detection* (MTTD), the amount of time between a failure occurring and when repair operations begin." (Understanding availability)
- Rule 1: three levers, longer MTBF, shorter MTTD, shorter MTTR. "Less frequent failure (longer MTBF), shorter failure detection times (shorter MTTD), and shorter repair times (shorter MTTR) are the three factors that are used to improve availability in distributed systems." (Understanding availability, Rule 1)
- MTBF and MTTR are averages with variance. "MTBF and MTTR are averages." (Distributed system availability)
- Forward-looking availability is a forecast, not a guarantee. "those calculations are not a guarantee of uptime or downtime." (Distributed system availability)
- Hard vs soft dependencies. "There are *hard* dependencies, which are those things that your workload cannot function without, and *soft* dependencies whose unavailability can go unnoticed or tolerated for some period of time." (Availability with dependencies)
- Series: the theoretical maximum is the product of every hard dependency's availability. "This is the product of the availability of all of the dependencies, including the software itself" (Availability with dependencies)
- Purely by the math, a workload is no more available than any dependency. "purely mathematically, a workload can be no more available than any of its dependencies." (Availability with dependencies)
- In practice the product underestimates, because dependencies often beat their SLAs. "A workload built using two or three dependencies with 99.99% availability SLAs can still achieve 99.99% availability itself, or higher." (Availability with dependencies)
- Dependencies often beat their SLA or SLO. "Dependencies frequently exceed their stated availability SLA or SLO." (Availability with dependencies)
- So the product is only a rough order of magnitude. "computing a maximum theoretical availability is only likely to produce a rough order of magnitude calculation" (Availability with dependencies)
- Fewer dependencies, fewer numbers below one multiplied together. "The fewer numbers less than one multiplied together, the larger the result." (Availability with dependencies)
- Rule 4: pick dependencies with goals at least as high as yours. "In general, select dependencies whose availability goals are equal to or greater than the goals of your workload." (Availability with dependencies, Rule 4)
- Parallel: the system is down only if both are down; failure probabilities multiply. "For the whole system to be down, both subsystems must be down at the same time." (Availability with redundancy)
- Two 99% subsystems give 99.99%. "This makes the availability using two redundant subsystems 99.99%." (Availability with redundancy)
- With s spares, the workload fails only when s + 1 fail. "In general, a workload with *s* spares will only fail if *s* \+ 1 subsystems fail." (Availability with redundancy)
- The formula is an approximation. "We can then produce a generalized availability approximation that incorporates the number of failure modes and sparing." (Availability with redundancy)
- Spares must fail independently, like instances in different AZs. "Sparing can be applied to any dependency that provides resources that fail independently." (Availability with redundancy)
- Spares cost at least linearly and add complexity. "Each additional spare costs the same as the original module, driving cost at least linearly." (Availability with redundancy)
- At three spares and beyond, expected downtime is fractions of a second a year. "At three spares and beyond, the result is fractions of a second of expected downtime a year" (Availability with redundancy)
- Future failures likely have different causes than past ones. "The reasons it fails in the future are likely to be different and possibly unknowable." (Distributed system availability)
- Beyond three spares, gains are fractions of a second a year. "Using more than three spares does not provide material, noticeable gain for almost all workloads when the subsystem itself has at least a 99% availability." (Availability with redundancy)
- Count spares at the unit of failure: 10 instances in one AZ fail together. "Because AZs are designed to be fault isolation boundaries, the unit of failure is not only a single EC2 instance, because an entire AZ worth of EC2 instances can fail together." (Availability with redundancy)
- 20 instances in two AZs is one spare AZ; 15 across three AZs covers one AZ loss for less. "This provides one spare AZ with a total of 15 EC2 instances (versus two AZs with 20 instances), still providing the required 10 total instances to serve peak capacity during an event impacting a single AZ." (Availability with redundancy)
- Spare across every isolation boundary used. "you should build in sparing to be fault tolerant across all fault isolation boundaries used by the workload (instance, cell, AZ, and Region)." (Availability with redundancy)
- Fault tolerance vs fault isolation. "Fault isolation minimizes the scope of impact when a failure does occur." (Fault tolerance and fault isolation)
- Static stability: pre-provision spare capacity instead of adding it during a failure. "A statically stable system uses the latter approach. It pre-provisions spare capacity to be available during failure." (Fault tolerance and fault isolation)

## Visuals worth redrawing

- The effect-of-sparing chart (downtime per year falls steeply, then
  flattens after about three spares).

## My notes

- Marked historical on every page. The math hasn't changed, but the
  AWS-specific advice may have moved to the Well-Architected Reliability
  Pillar.
- The url is the "Understanding availability" page; the claims come
  from it and its subpages (distributed-system-availability,
  availability-with-dependencies, availability-with-redundancy,
  fault-tolerance-and-fault-isolation).
