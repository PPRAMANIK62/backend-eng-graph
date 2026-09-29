---
id: kubernetes-writing-controllers
title: Writing Controllers
author: Kubernetes SIG API Machinery (kubernetes/community repository)
url: https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/controllers.md
kind: docs
primary: true
---

## Summary

The Kubernetes contributor guide for people writing controllers. It
reduces a controller to a three-line loop (get desired, get current, make
changes) and then lists the rules that keep real controllers correct:
level driven, one item at a time, shared caches, other actors, retries,
and leader election that is still imperfect.

## Key claims

- A controller is a reconciliation process. "A Kubernetes controller is an active reconciliation process." (intro)
- The simplest form is a loop; watches just make it cheaper. "Watches, etc, are all merely optimizations of this logic." (intro)
- One item at a time through a work queue. "you'll be able to queue references to particular objects and later pop them in multiple “worker” goroutines with a guarantee that no two goroutines will work on the same item at the same time." (Guidelines, 1)
- No ordering between watches of different resources. "Distinct watches are updated independently." (Guidelines, 2)
- Level driven, not edge driven. "Just like having a shell script that isn't running all the time, your controller may be off for an indeterminate amount of time before running again." (Guidelines, 3)
- You can't count on seeing a transition. "you can't count on having seen it turn from `false` to `true`, only that you now observe it being `true`." (Guidelines, 3)
- Don't act before the cache is filled. "make sure you don't have a bug in your observation code (e.g., act before your cache has filled)." (Guidelines, 7)
- Others change things too. "Just because you haven't changed an object doesn't mean that somebody else hasn't." (Guidelines, 7)
- Run spare copies with leader election, which is still imperfect. "even when using leader election it is still possible --- although very unlikely --- that multiple copies of your controller may be active." (Guidelines, 8)
- Errors requeue with backoff. "We have a  `workqueue.RateLimitingInterface` to allow simple requeuing with reasonable backoffs." (Guidelines, 9)
- Informers resync periodically. "Informers can periodically “resync”." (Guidelines, 10)
- The simplest controller is a three-line loop. "The simplest implementation of this is a loop:" (intro; the loop calls getDesiredState, getCurrentState, makeChanges)
- Wait for caches before the first sync. "Use the `cache.WaitForCacheSync` function to wait for your secondary caches before starting your primary sync functions." (Guidelines, 4)
- An item dropped after a failure may never be retried. "If you ever skip requeuing your item on failures, you could fail, not requeue, and then never retry that item again." (Guidelines, 10)

## Visuals worth redrawing

None.

## My notes

- The "shell script that isn't running" line is the best short
  explanation of level-triggered I've found.
