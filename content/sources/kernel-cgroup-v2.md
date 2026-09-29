---
id: kernel-cgroup-v2
title: Control Group v2
author: Tejun Heo (Linux kernel documentation)
url: https://docs.kernel.org/admin-guide/cgroup-v2.html
kind: docs
primary: true
---

## Summary

The authoritative document for cgroup v2, by its maintainer: the single
hierarchy, how controllers are enabled down the tree, the rules (top-down,
no internal processes), the four ways resources are handed out (weights,
limits, protections, allocations), and every interface file of the cpu,
memory, io and pids controllers. Also a section on why v1 was replaced.

## Key claims

- What cgroup is. "cgroup is a mechanism to organize processes hierarchically and distribute system resources along the hierarchy in a controlled and configurable manner." (What is cgroup?)
- Core plus controllers. "cgroup core is primarily responsible for hierarchically organizing processes." (What is cgroup?)
- Every process is in exactly one cgroup; children start in the parent's. "cgroups form a tree structure and every process in the system belongs to one and only one cgroup." (What is cgroup?)
- Limits near the root can't be overridden further down. "The restrictions set closer to the root in the hierarchy can not be overridden from further away." (What is cgroup?)
- v2 has a single hierarchy. "Unlike v1, cgroup v2 has only single hierarchy." (Mounting)
- A cgroup is a directory; create it with mkdir. "A child cgroup can be created by creating a sub-directory" (Processes)
- Move a process by writing its PID to cgroup.procs. "A process can be migrated into a cgroup by writing its PID to the target cgroup’s “cgroup.procs” file." (Processes)
- Moving any thread's PID moves the whole process. "If a process is composed of multiple threads, writing the PID of any thread migrates all threads of the process." (Processes)
- An empty cgroup is removed with rmdir. "A cgroup which doesn’t have any children or live processes can be destroyed by removing the directory." (Processes)
- /proc/PID/cgroup shows membership. "“/proc/$PID/cgroup” lists a process’s cgroup membership." (Processes)
- cpu.stat's throttled_usec counts throttling from the group's own limit. "Unlike the throttled_usec reported by cpu.stat which accounts for throttling caused by this cgroup’s own CFS bandwidth limit" (cpu.stat.local)
- io.max example. "echo "8:16 rbps=2097152 wiops=120" > io.max" (io.max)
- Moving a process doesn't move memory it already charged. "Migrating a process to a different cgroup doesn’t move the memory usages that it instantiated while in the previous cgroup to the new cgroup." (Memory Ownership)
- memory.events counts limit hits, e.g. max. "The number of times the cgroup’s memory usage was about to go over the max boundary." (memory.events)
- A forked child is born into the parent's cgroup. "When a process forks a child process, the new process is born into the cgroup that the forking process belongs to at the time of the operation." (Processes)
- Controllers are enabled for children through cgroup.subtree_control. "Controllers can be enabled and disabled by writing to the “cgroup.subtree_control” file" (Enabling and Disabling)
- No internal processes: domain controllers only on cgroups without their own processes. "Non-root cgroups can distribute domain resources to their children only when they don’t have any processes of their own." (No Internal Process Constraint)
- Weights: share by ratio, work-conserving; range 1 to 10000, default 100. "All weights are in the range [1, 10000] with the default at 100." (Weights)
- Limits can be over-committed. "Limits can be over-committed - the sum of the limits of children can exceed the amount of resource available to the parent." (Limits)
- cpu.max format and default. "The default is “max 100000”." (cpu.max)
- cpu.max meaning. "which indicates that the group may consume up to $MAX in each $PERIOD duration." (cpu.max)
- Time units in cpu files are microseconds. "All time durations are in microseconds." (CPU Interface Files)
- cpu.stat reports nr_throttled and throttled_usec when the controller is on. (CPU Interface Files, cpu.stat; list of field names)
- The memory controller counts page cache. "Userland memory - page cache and anonymous memory." (Memory)
- It also counts kernel structures and socket buffers. "Kernel data structures such as dentries and inodes." (Memory)
- memory.high throttles and reclaims, never OOM-kills. "Going over the high limit never invokes the OOM killer and under extreme conditions the limit may be breached." (memory.high)
- memory.max is the hard limit; hitting it and not reclaiming means OOM kill inside the cgroup. "If a cgroup’s memory usage reaches this limit and can’t be reduced, the OOM killer is invoked in the cgroup." (memory.max)
- memory.high is meant as the main control. "“memory.high” is the main mechanism to control memory usage." (Usage Guidelines)
- memory.stat `file` field is page cache. "Amount of memory used to cache filesystem data, including tmpfs and shared memory." (memory.stat, file)
- Memory use alone doesn't show if a workload needs more memory. "Determining whether a cgroup has enough memory is not trivial as memory usage doesn’t indicate whether the workload can benefit from more memory." (Usage Guidelines)
- Memory is charged to the cgroup that first touched it, and stays there. "A memory area is charged to the cgroup which instantiated it and stays charged to the cgroup until the area is released." (Memory Ownership)
- Shared page cache pages land in one cgroup, nondeterministically. "To which cgroup the area will be charged is in-deterministic" (Memory Ownership)
- memory.oom.group kills the whole cgroup together. "If set, all tasks belonging to the cgroup or to its descendants (if the memory cgroup is not a leaf cgroup) are killed together or not at all." (memory.oom.group)
- io.max limits bytes and IOPS per device. "“io.max” limits the maximum BPS and/or IOPS that a cgroup can consume on an IO device" (Limits)
- Writeback of page cache is charged per cgroup only on some filesystems. "Currently, cgroup writeback is implemented on ext2, ext4, btrfs, f2fs, and xfs." (Writeback)
- pids.max stops fork bombs that memory limits wouldn't catch in time. "For example, a fork bomb is likely to exhaust the number of tasks before hitting memory restrictions." (PID)
- v1's many hierarchies were flexible but not useful in practice. "While this seemed to provide a high level of flexibility, it wasn’t useful in practice." (Multiple Hierarchies)
- Why v2 prefers memory.high: a hard limit needs an accurate working set estimate. "Since working set size estimation is hard and error prone, and getting it wrong results in OOM kills, most users tend to err on the side of a looser limit and end up wasting precious resources." (Controller Issues and Remedies, Memory)
- Allocations cannot be over-committed. "Allocations can’t be over-committed - the sum of the allocations of children can not exceed the amount of resource available to the parent." (Allocations)
- memory.low protects memory below the line while unprotected memory can be taken instead. "If the memory usage of a cgroup is within its effective low boundary, the cgroup’s memory won’t be reclaimed unless there is no reclaimable memory available in unprotected cgroups." (memory.low)
- Above memory.high the group is throttled and made to reclaim. "If a cgroup’s usage goes over the high boundary, the processes of the cgroup are throttled and put under heavy reclaim pressure." (memory.high)
- memory.events has an oom_kill field. (memory.events, list of fields: low, high, max, oom, oom_kill)
- The v1 file for the hard memory limit was memory.limit_in_bytes. "Setting the original memory.limit_in_bytes below the current usage was subject to a race condition" (Controller Issues and Remedies, Memory)

## Visuals worth redrawing

The A(cpu,memory) - B(memory) - C, D example of which controllers are
enabled where.

## My notes

- The page header carries a date; don't copy it.
- PSI files (cpu.pressure, memory.pressure) are in kernel-psi.
