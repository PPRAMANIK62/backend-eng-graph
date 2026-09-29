---
id: clusterlabs-pacemaker-fencing
title: "Pacemaker Explained, 8. Fencing"
author: The Pacemaker project (ClusterLabs)
url: https://clusterlabs.org/projects/pacemaker/doc/3.0/Pacemaker_Explained/html/fencing.html
kind: docs
primary: true
---

## Summary

The fencing chapter of the Pacemaker 3.0 manual, from the project that
builds the Pacemaker cluster manager. Defines fencing
(STONITH), says it exists to prevent split brain, shows what split brain
does to different resources, and sets the rules a fence device has to
follow to be trusted.

## Key claims

- What fencing is. "Fencing is the ability to make a node unable to run resources, even when that node is unresponsive to cluster commands." (8.1)
- STONITH, and the two ways to do it: cut power, or cut access. "Fencing is also known as STONITH , an acronym for “Shoot The Other Node In The Head”, since the most common fencing method is cutting power to the node." (8.1)
- Fabric fencing. "Another method is “fabric fencing”, cutting the node’s access to some capability required to run resources (such as network access or a shared disk)." (8.1)
- Split brain, defined. "Fencing protects against the “split brain” failure scenario, where cluster nodes have lost the ability to reliably communicate with each other but are still able to run resources." (8.2)
- Why you can't just assume silence means dead. "If the cluster just assumed that uncommunicative nodes were down, then multiple instances of a resource could be started on different nodes." (8.2)
- What it does depends on the resource: one IP on two hosts is useless; a database can corrupt or diverge. "For a database or clustered file system, the effect could be much more severe, causing data corruption or divergence." (8.2)
- The IP example. "an IP address brought up on two hosts on a network will cause packets to randomly be sent to one or the other host, rendering the IP useless." (8.2)
- The fence device can't depend on the cluster's own network. "it is essential that they do not rely on the same network as the cluster itself, otherwise that network becomes a single point of failure." (8.3)
- Power loss looks like network loss, so a fence device shouldn't share power with its target. "Since loss of a node due to power outage is indistinguishable from loss of network connectivity to that node, it is also essential that at least one fence device for a node does not share power with that node." (8.3)
- Example: the on-board controller. "For example, an on-board IPMI controller that shares power with its host should not be used as the sole fencing device for that host." (8.3)
- A fence can't rely on its target cooperating, so a device that logs in over ssh and shuts the node down is for testing only, never production. "Since fencing is used to isolate malfunctioning nodes, no fence device should rely on its target functioning properly." (8.3)
- Only a partition with quorum fences, by default. "In general, a cluster partition may execute fencing only if the partition has quorum, and the fencing-enabled cluster property is set to true." (8.11)

## Visuals worth redrawing

None.

## My notes

- Pacemaker 3.0 docs. Examples of fence devices: intelligent power
  switches, IPMI, SCSI reservations on a shared disk (8.3).
