---
id: kingsbury-bailis-network-reliable-2013
title: The network is reliable
author: Kyle Kingsbury and Peter Bailis
url: https://aphyr.com/posts/288-the-network-is-reliable
kind: blog
primary: false
---

## Summary

A 2013 survey of published network failures and postmortems, written to
settle whether partitions really happen. It collects datacenter studies
(Microsoft, HP, Google) and dozens of incident reports (GitHub, EC2,
Twilio, Fog Creek, CloudFlare) where partitions, flaky NICs, GC pauses and
switch bugs caused split brain, lost writes and outages. A later version ran
in ACM Queue (2014); that page returned 403 when this note was made, so the
blog version is the one read.

## Key claims

- Evidence on partitions is thin because organizations rarely publish it. "much of what we know about the failure modes of real-wold distributed systems is founded on guesswork and rumor." (intro)
- Microsoft datacenter study: 5.2 devices and 40.8 links failing per day, median repair about five minutes. "They found an average failure rate of 5.2 devices per day and 40.8 links per day with a median time to repair of approximately five minutes (and up to one week)." (The Microsoft Datacenter Study)
- Redundancy helps less than expected. "network redundancy improves median traffic by only 43%" (The Microsoft Datacenter Study)
- Partitions aren't only the physical network: crashes, scheduler latency, overload and GC pauses delay or drop messages too. "Not all partitions originate in the physical network." (Application-level failures)
- GC pauses and IO waits can last seconds to minutes and trigger elections. "Stop-the-world garbage collection and blocking for disk IO can cause runtime latencies on the order of seconds to minutes." (Long GC pauses and IO)
- One-way failure: a Broadcom BCM5709 NIC dropped inbound but not outbound packets, so heartbeats kept the spare from taking over; the service was down for five hours. "Because the NIC dropped inbound packets, the node was unable to service requests." (BCM5709 and friends)
- GitHub: a 90-second spanning-tree reconvergence blocked traffic between access switches; DRBD fileserver pairs each thought the other dead, both shot each other, recovery took five hours. "blocking all traffic between access switches for 90 seconds." (MLAG, Spanning Tree, and STONITH)
- GitHub's Pacemaker-managed MySQL failed over under load and then split into two clusters; private repositories showed up on the wrong dashboards. "Github showed private repositories to the wrong users' dashboards" (MySQL overload and a Pacemaker segfault)
- A two-node cluster can't safely pick a primary during a partition. "When a two-node cluster partitions, there are no cases in which a node can reliably declare itself to be the primary." (DRBD split-brain)
- MongoDB on EC2: a partition isolated the primary; when it rejoined two hours later its writes were rolled back. "This partition caused two hours of write loss." (An isolated MongoDB primary on EC2)
- Twilio: after a partition healed, every Redis replica resynced at once and overloaded the primary; a bad restart then left billing read-only and customers were overbilled. "1.1% of customers were overbilled, for roughly 40 minutes." (Isolated Redis primary on EC2)
- CENIC WAN study: 508 isolating partitions over five years; mean duration from 6 minutes (software) to over 8.2 hours (hardware). "they discovered over 508 “isolating network partitions” that caused connectivity problems between hosts." (CENIC Study)
- Some networks really are reliable, at a price. "Cautious engineering (and lots of money) can prevent outages." (Where do we go from here?)
- Engineers at major financial firms rarely see partitions. "Engineers at major financial firms report that despite putting serious effort into designing systems that gracefully tolerate partitions, their networks rarely, if ever, exhibit partition behavior." (Where do we go from here?)
- Decide partition behaviour at design time. "it's much easier to make decisions about partition tolerance on a whiteboard than to redesign, re-engineer, and upgrade a complex system in a production environment" (Where do we go from here?)

## Visuals worth redrawing

None.

## My notes

- Secondary: every incident is second-hand from someone's postmortem. Good
  as a catalogue; for any one incident, prefer the original postmortem.
