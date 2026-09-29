---
id: autoscaling
title: Autoscaling
depth: short
phase: 14
note: >-
  Adding and removing copies of a service from a metric, and why it
  reacts too late for a sudden spike.
needs: [kubernetes, metrics, capacity-planning, health-checks]
leads_to: []
compare_with: [load-shedding]
---

# Autoscaling

Autoscaling adds copies of a service when a metric says it's busy and
removes them when it's quiet. It saves you from paying for peak
capacity all day, and from resizing by hand. But every step of it
takes time, so it follows a slow rise in load well and a sudden spike
badly. For the spike you still need headroom and a way to shed load.

## The loop

The Kubernetes HorizontalPodAutoscaler (HPA) is a typical example. It's
a [[control-loops|control loop]] that runs every 15 seconds by
default. Each time, it reads a [[metrics|metric]] for the pods of one
Deployment, compares it with a target, and sets the replica count:

```
desired = ceil(current replicas × current metric / target metric)
```

Say the order service runs 4 pods, the target is 60% CPU and the pods
average 90%. The HPA asks for ceil(4 × 90 / 60) = 6 pods. The
[[kubernetes|Kubernetes]] Deployment then starts two more. If the ratio
is within 10% of 1.0, it does nothing, so small wobbles don't cause
changes.

A few details catch people out:

- **CPU is measured against the pod's request.** 60% means 60% of the
  CPU the pod asked for. If a container has no CPU request, the HPA
  can't compute a utilization and takes no action on that metric.
- **Several metrics, biggest answer wins.** Scale on CPU and on
  requests per second, and the HPA picks whichever asks for more pods.
- **Pod usage is summed over its containers.** One container can be
  maxed out while the pod average looks fine.

This is horizontal scaling: more copies. Vertical scaling gives each
copy more CPU or memory instead.

## Why it's too late for a spike

Follow a sudden doubling of traffic through the loop:

![A chart of load and capacity over time. Load jumps suddenly to a new, higher level. Capacity stays flat, then rises in steps: first the metric has to reflect the new load, then the next 15-second autoscaler cycle has to run, then new pods have to be scheduled, start, warm up and pass readiness before they take traffic. During the gap between the load step and the capacity steps, the existing pods are overloaded; that gap is what headroom and load shedding have to cover.](img/autoscaling-lag.svg)

*Why capacity trails a sudden spike.*

1. **The metric has to show it.** The HPA reads pod metrics from a
   metrics API, usually served by the Metrics Server add-on. The new
   load has to show up there first.
2. **The loop has to run.** Up to 15 seconds.
3. **New pods have to start.** Scheduling, pulling an image, starting
   the process, warming caches, passing the readiness
   [[health-checks|check]]. Creating new instances is never instant.
4. **Starting pods don't count yet.** To avoid being fooled by the
   CPU burst of a warming app, the HPA ignores the CPU of pods that
   aren't stably ready yet, for up to 5 minutes after start, and
   assumes not-ready pods use 0% when deciding to scale up. Both make
   the next step more cautious.
5. **Growth is capped.** By default the HPA adds at most 4 pods or
   doubles the count every 15 seconds.

Meanwhile the existing pods take the whole spike. If they're already
near their limit, latency climbs, queues grow and requests time out
before the new pods arrive. So an autoscaler is not a replacement for
[[capacity-planning]]. It needs headroom: run far enough below the
bottleneck that the fleet can absorb a spike while the new copies
start. And for the part of a spike that headroom can't absorb, the
service has to refuse work cleanly; that's [[load-shedding]].

## Up fast, down slow

Scaling up too late drops traffic; scaling down too early just means
scaling up again. So autoscalers are deliberately eager to grow and
reluctant to shrink. The HPA has no waiting period for scale-up by
default, but for scale-down it takes the highest recommendation of the
last 5 minutes. Without that, a noisy metric makes the replica count
flap up and down.

## Where it gets tricky

**Autoscaling amplifies bugs.** Release a version that burns CPU
without doing work, and a CPU-based autoscaler keeps adding copies
until the quota runs out. Or a dependency hangs: requests pile up on
your servers, utilization rises, the autoscaler adds servers, and they
send even more traffic at the dependency that's trying to recover.
Always set a minimum and a maximum, and have a documented way to
switch autoscaling off.

**More copies means more load downstream.** Doubling the frontends can
double the queries hitting the database, which may not scale the
same way. Check what your dependencies can take before setting the
maximum. The capacity has to exist somewhere.

**Unhealthy copies drag the average.** Instances that are stuck or
still starting count toward the average without serving, which can
stop scaling from happening at all. Scaling on a metric the load
balancer sees, which only counts serving copies, avoids that.

**Load shedding can hide the signal.** If a service sheds requests to
keep its CPU at the same level the autoscaler targets, CPU never rises
and the autoscaler never gets the signal to add capacity. Set the
autoscaler to act before shedding starts.

**Stateful services don't scale by adding copies.** When a user's
session always goes to the same server, a [[hot-spots|hot server]] stays hot
no matter how many others you add.

## What this means when you build

- Set CPU and memory requests on every container, or CPU-based
  scaling won't work.
- Target a utilization low enough to ride out a spike while new
  copies start. Know how long a new copy takes to become ready.
- Make startup fast, and make readiness honest.
- Set minimum and maximum replicas, and know how to turn autoscaling
  off.
- Pair autoscaling with load shedding, and make sure the scaler
  triggers first.

## Further reading

- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/), Kubernetes docs (v1.35). The loop, the formula, how starting pods are treated, and the default scaling policies.
- [Managing Load](https://sre.google/workbook/managing-load/), *The Site Reliability Workbook*, Google, 2018. Autoscaling's failure modes: unhealthy instances, runaway scaling, overloaded backends, and how it interacts with load shedding.
- [Using load shedding to avoid overload](https://d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf), David Yanacek, Amazon Builders' Library, 2019. Why shedding at the autoscaler's CPU target starves it of its signal.
