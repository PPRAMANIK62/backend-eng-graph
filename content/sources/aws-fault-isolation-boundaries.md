---
id: aws-fault-isolation-boundaries
title: AWS Fault Isolation Boundaries
author: Michael Haken (AWS)
url: https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html
kind: docs
primary: true
---

## Summary

AWS whitepaper (2022) on the isolation boundaries AWS builds with:
Availability Zones, Regions, control planes and data planes. The
introduction, "Availability Zones" and "Regions" pages were read. What
an AZ physically is, how far apart they are, what they don't share, and
how Regions are kept apart.

## Key claims

- AWS builds with several fault isolation constructs with a predictable scope of impact. "These fault isolation boundaries enable customers to design their workloads to take advantage of the predictable scope of impact containment they provide." (Introduction)
- An AZ is one or more data centers with separate, redundant power and networking. "An Availability Zone is one or more discrete data centers with separate and redundant power infrastructure, networking, and connectivity in an AWS Region." (Availability Zones)
- AZs are up to about 100 km apart: far enough to avoid shared disasters, close enough for synchronous replication. "Availability Zones in a Region are meaningfully distant from each other, up to 60 miles (\~100 km) to prevent correlated failures, but close enough to use synchronous replication with single-digit millisecond latency." (Availability Zones)
- They're designed not to share fate on power, water, fiber, earthquakes, fires, floods. "They are designed not to be simultaneously impacted by a shared fate scenario like utility power, water disruption, fiber isolation, earthquakes, fires, tornadoes, or floods." (Availability Zones)
- Generators and cooling aren't shared; different substations. "Common points of failure, like generators and cooling equipment, are not shared across Availability Zones and are designed to be supplied by different power substations." (Availability Zones)
- Software deploys are staggered across AZs, so a bad deploy is also kept inside one. "When AWS deploys updates to its services, deployments to Availability Zones in the same Region are separated in time to prevent correlated failure." (Availability Zones)
- Regions have three or more AZs and are isolated from each other. "All Regions currently have three or more Availability Zones." (Regions)
- Region separation limits failures to one Region. "This separation between Regions limits service failures, when they occur, to a single Region." (Regions)
- Data doesn't leave a Region unless you replicate it. "the resources and data that you create in one Region do not exist in any other Region unless you explicitly use a replication or copy feature offered by an AWS service or replicate the resource yourself." (Regions)

## Visuals worth redrawing

- The Availability Zones figure: a Region with several AZs, each one or
  more data centers, linked to each other and to transit centers.

## My notes

- The url is the "Availability Zones" page; the Regions and
  introduction pages are siblings in the same whitepaper.
