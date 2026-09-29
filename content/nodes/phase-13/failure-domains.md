---
id: failure-domains
title: Failure domains
depth: short
phase: 13
note: >-
  Things that fail together: a disk, a rack, a zone, a region.
needs: [availability-math]
leads_to: [cell-based-architecture, shuffle-sharding]
compare_with: []
---

# Failure domains

A failure domain is a set of things that fail together because they
share something: a power cable, a network switch, a building, a
software rollout. Redundancy only protects you if the copies sit in
different failure domains. Three replicas on one rack are one replica
as far as the rack's switch is concerned.

## Domains nest

Start with one copy of your data on one disk, and walk outward:

- **Disk.** The smallest unit. A copy on another disk covers it.
- **Machine.** Takes all its disks with it: a kernel crash, or a
  planned reboot for a kernel upgrade.
- **Rack.** Machines in a rack share a network switch and power
  cabling. One bad switch or cable takes out the whole rack.
- **Zone.** A zone (an AWS Availability Zone, say) is one or more data
  centers with their own power, cooling and network. AWS keeps its
  zones apart physically, up to about 100 km, and feeds them from
  different power substations so a fire, flood or grid failure hits
  only one.
- **Region.** A group of zones in one geographic area. Regions are kept
  isolated from each other, and your data stays in one unless you copy
  it out.

![Nested boxes. The outermost is a region, containing zones; each zone contains racks; each rack contains machines; each machine contains disks. Next to each level is what its members share: disks share a machine; machines in a rack share a switch and power cabling; racks in a zone share generators, cooling and a power substation; zones in a region share a geographic area. A bar across all levels says software rollouts can cross any boundary.](img/failure-domains-nesting.svg)

*Failure domains nest, and software cuts across all of them.*

Each step out survives more, and costs more. Zones in one region are
close enough for synchronous [[replication]] with single-digit
millisecond latency (see [[sync-vs-async-replication]]). Going across
regions adds far more distance; that's the subject of
[[multi-region]].

## Failures come in bursts

The parallel formula in [[availability-math]] multiplies the chances of
each copy failing. That's only right if failures are independent, and
in real fleets they aren't.

A year of data from Google's storage clusters showed how far off it
is. About 37% of machine failures came in bursts of two or more at
once. The big bursts were mostly whole racks or groups of racks: of the
bursts that hit 10 or more machines, only 3% had every machine on a
different rack. Modelling the same failure rate as independent
overestimated data availability by at least two orders of magnitude.
Correlation also flattened the benefit of more replicas: adding
copies helped much less than the independent math predicts.

The fix was placement. Spreading the chunks of each piece of data so
that no two sat on the same rack typically tripled the mean time
until a piece of data became unavailable.

## Placing copies across domains

Storage systems let you say which level is the failure domain. Ceph's
CRUSH map describes the physical layout as a tree (host, chassis, rack,
row, PDU, room, datacenter and up) and each placement rule names a
level. With the failure domain set to host, every replica lands on a
different host. With rack, every replica lands on a different rack,
which is typical for mid- to large-sized clusters.

Cloud services do the same with zones: run instances in more than one
zone, keep replicas in different zones. Count spare capacity at the
same level. If you need 10 machines at peak, 10 more in the same zone
don't help when the zone goes; 10 in a second zone do. Spreading over
three zones with 5 each gets you there with 15 machines instead of 20,
because losing one zone still leaves 10.

## Where it gets tricky

**Software is a failure domain too.** A bad deploy can hit every rack and zone at once, however well you spread the
hardware. In Google's storage data, planned reboots, like kernel
upgrades rolled across the fleet, caused most of the unavailability.
That's why AWS rolls out updates to the zones of a region at different
times, and why progressive rollouts matter (see
[[deployment-strategies]]).

**Hidden shared parts.** Two copies in two zones can still share
dependencies and global control planes. Any of those puts them
back in one domain for some failures, which is why a 99.9% service in
two zones doesn't come out at 99.9999%.

**Bigger domains cost latency and money.** Every level you spread
across adds distance, and spares at a bigger level are bigger spares.
Pick the level from the failures you need to survive.

## What this means when you build

- For each piece of state, write down which failures it must survive:
  a disk, a machine, a rack, a zone, a region.
- Put replicas in different domains at that level, and check the
  placement, don't assume it.
- Size spares so losing one whole domain still leaves enough capacity.
- Roll out code and config one domain at a time, so a bad change stays
  inside one. [[cell-based-architecture|Cells]] take this idea further.

## Further reading

- [Availability in Globally Distributed Storage Systems](https://www.usenix.org/legacy/event/osdi10/tech/full_papers/Ford.pdf), Daniel Ford et al., Google, OSDI 2010. A year of failure data showing that failures come in rack-shaped bursts, and what independence assumptions get wrong.
- [AWS Fault Isolation Boundaries](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html), Michael Haken, AWS, 2022. What an Availability Zone and a Region physically are, and what they don't share.
- [CRUSH Maps](https://docs.ceph.com/en/latest/rados/operations/crush-map/), Ceph documentation. Failure domains written down as a placement hierarchy.
- [Implementing SLOs](https://sre.google/workbook/implementing-slos/), Steven Thurgood, David Ferguson, Alex Hidalgo, Betsy Beyer, Google SRE Workbook, 2018. The "Modeling Dependencies" section: why two zones don't multiply out.
- [Availability and Beyond](https://docs.aws.amazon.com/whitepapers/latest/availability-and-beyond-improving-resilience/understanding-availability.html), Michael Haken, AWS, 2021. Counting spares at the unit of failure: one spare zone, not ten spare instances.
