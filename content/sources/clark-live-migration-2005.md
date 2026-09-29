---
id: clark-live-migration-2005
title: Live Migration of Virtual Machines
author: Christopher Clark, Keir Fraser, Steven Hand, Jacob Gorm Hansen, Eric Jul, Christian Limpach, Ian Pratt and Andrew Warfield
url: https://www.usenix.org/legacy/event/nsdi05/tech/full_papers/clark/clark.pdf
kind: paper
primary: true
---

## Summary

The NSDI 2005 paper that built live migration into Xen: copy a running VM's
memory to another host while it keeps running, then stop it briefly to copy
the last dirty pages and resume on the new host. The guest's processes
don't take part; the whole OS just stops for the final copy.

## Key claims

- Most of the migration happens while the OS keeps running, leaving a short downtime. "we demonstrate the migration of entire OS instances on a commodity cluster, recording service downtimes as low as 60ms." (Abstract)
- Measured examples: a web server with 210 ms of unavailability, a Quake 3 server with 60 ms. "to migrate across two physical hosts with only 210ms unavailability" (1)
- The final phase stops the VM entirely. "Stop-and-Copy We suspend the running OS instance at A and redirect its network traffic to B." (3, Stage 3)
- The whole OS moves as a unit, including kernel state such as TCP connections, so clients don't reconnect. "This applies to kernel-internal state (e.g. the TCP control block for a currently active connection)" (1)

## Visuals worth redrawing

None.

## My notes

- The point for `process-pauses`: during stop-and-copy every process in the
  guest is frozen and doesn't know. The numbers are best cases from 2005
  hardware and Xen; don't generalize them to today's clouds.
