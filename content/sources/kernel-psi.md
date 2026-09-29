---
id: kernel-psi
title: PSI - Pressure Stall Information
author: Johannes Weiner (Linux kernel documentation)
url: https://docs.kernel.org/accounting/psi.html
kind: docs
primary: true
---

## Summary

The kernel's documentation for pressure stall information (PSI): how much
of the time tasks are stalled waiting on CPU, memory or I/O, exported in
`/proc/pressure/` and per cgroup. It's a direct measure of how much a
resource shortage is costing in time, which makes it a modern saturation
signal. Written by the feature's author.

## Key claims

- Why it exists: contention causes latency spikes and throughput loss, and without a measure you either under-use or overcommit. "When CPU, memory or IO devices are contended, workloads experience latency spikes, throughput losses, and run the risk of OOM kills." (intro)
- Three files, one per resource. "Pressure information for each resource is exported through the respective file in /proc/pressure/ -- cpu, memory, and io." (Pressure interface)
- The some line. "The “some” line indicates the share of time in which at least some tasks are stalled on a given resource." (Pressure interface)
- The full line. "The “full” line indicates the share of time in which all non-idle tasks are stalled on a given resource simultaneously." (Pressure interface)
- In the full state CPU cycles are wasted; long stretches of it are thrashing. "In this state actual CPU cycles are going to waste, and a workload that spends extended time in this state is considered to be thrashing." (Pressure interface)
- Averages over 10, 60 and 300 seconds, plus a total in microseconds so short spikes aren't lost. "The ratios (in %) are tracked as recent trends over ten, sixty, and three hundred second windows" (Pressure interface)
- The total catches spikes the averages would hide. "to allow detection of latency spikes which wouldn’t necessarily make a dent in the time averages" (Pressure interface)
- CPU full is undefined system-wide; reported as zero since 5.13 for compatibility. "CPU full is undefined at the system level, but has been reported since 5.13, so it is set to zero for backward compatibility." (Pressure interface)
- You can register a trigger and poll for it. "Users can register triggers and use poll() to be woken up when resource pressure exceeds certain thresholds." (Monitoring for pressure thresholds)
- Per-cgroup files exist with the same format. "Each subdirectory in the cgroupfs mountpoint contains cpu.pressure, memory.pressure, and io.pressure files" (Cgroup2 interface)
- Meant for acting on in real time, like load shedding. "systems can be managed dynamically using techniques such as load shedding, migrating jobs to other systems or data centers" (intro)

## Visuals worth redrawing

None.

## My notes

- The page doesn't say which kernel version added PSI, so don't state one.
- PSI measures time lost to waiting, not queue length, so it's closer to
  "how much is saturation hurting" than to Gregg's run-queue-length
  example.
