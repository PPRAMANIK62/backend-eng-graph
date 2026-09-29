---
id: control-loops
title: Control loops
depth: short
phase: 14
note: >-
  Compare desired state with actual state, act, repeat.
needs: []
leads_to: [kubernetes, infrastructure-as-code]
compare_with: [leader-election, idempotency]
---


# Control loops

A control loop keeps comparing what you want with what there is, and
does something to close the gap. Then it does it again, forever. Most
of [[kubernetes|Kubernetes]] is built out of these loops, and if you
ever write a controller or an operator, this is the shape you're
writing.

## Start with a thermostat

You set a thermostat to 21 degrees. That's the desired state. The room
is at 18. That's the current state. The thermostat turns the heater on,
and when the room reaches 21 it turns it off. If someone opens a window,
the room cools, and the thermostat turns the heater on again. It never
finishes. It doesn't need to know why the room got cold. It only looks
at the gap.

A Kubernetes controller works the same way. You write the desired state
into an object, in a field called `spec`. The system writes what it has
observed into `status`. A controller watches both and acts on the
difference. Stripped down, the whole thing is three lines:

```go
for {
  desired := getDesiredState()
  current := getCurrentState()
  makeChanges(desired, current)
}
```

Say you ask for three copies of a web server. A node dies and takes one
copy with it. The controller counts two, wants three, and starts one
more. It doesn't matter whether the copy vanished because a node died,
someone deleted it by hand, or it was never started. The response is
the same: look, compare, act.

![A loop: the desired state (spec, three replicas) and the observed state (status, two replicas) feed a compare step; the difference drives an action (create one pod) on the world; the world is observed again and the loop repeats. Other controllers and people also change the world from the side.](img/control-loops-reconcile.svg)

*The loop only ever looks at the gap between the two states, never at the history of how the gap appeared.*

## Look at the level, not the edge

There are two ways to react to change. **Edge-triggered** code reacts
to events: "a pod was deleted, so start one". **Level-triggered** code
looks at the current state: "there are two pods and I want three".

Kubernetes controllers are level-triggered on purpose. A controller can
be down for a while, like a shell script that isn't always running.
When it comes back it can't count on having seen every change, only on
what's true now. Watches, the stream of change events from the API, are
only a way to wake the loop up sooner. If an event is missed, the next
look at the state still finds the gap.

This also means the system doesn't have to visit every intermediate
value. If you change a replica count from 2 to 5 and then to 3 before
the controller catches up, it can go straight to 3. It drives toward
the latest desired state, not through a replay of your edits.

## Many small loops that talk through shared state

Kubernetes runs lots of small controllers, each owning one piece of
cluster state, instead of one big program with a plan. Most of them
don't act on the world directly. They write to the API server, and
other loops pick that up.

The Job controller, for example, never starts a container. It sees a
Job that needs pods and creates Pod objects. The scheduler, another
loop, sees pods with no node and assigns them. The kubelet on that
node, another loop, sees pods assigned to it and starts them. Each one
reports what it did back into `status`, where the next loop can see it.

Since each loop acts on what it sees rather than on what it remembers,
a loop that crashes and comes back doesn't need to resume anything. It
looks again and closes whatever gap is there.

## Where it gets tricky

**Acting on a partial view.** A controller that works from a cache can
act before the cache is filled. If it reads "no pods exist" from an
empty cache, it might create too many, or delete things it thinks
shouldn't exist. Controllers wait for their caches to sync before the
first pass.

**Other actors.** Your controller isn't the only thing changing the
world. People, scripts and other controllers edit the same objects.
Two controllers that both think they own the same pods get in each
other's way. Kubernetes uses labels so a controller can tell its own
objects from another controller's.

**Two copies at once.** Controllers run with spare copies and use
[[leader-election]] so only one is active. Even so, two copies can
briefly act at the same time. A loop whose actions are
[[idempotency|safe to repeat]] handles that better than one that
assumes it's alone.

**It may never settle.** In a large cluster something is always
changing, so the whole system may never reach a stable state. That's
fine as long as each loop keeps making progress.

**Failures come back around.** When an action fails, the item goes back
on a queue and is retried with [[retries-with-backoff|backoff]]. A
controller that drops an item after a failure may never look at it
again until something else changes.

## What this means when you build

- Write the desired state down, and make the loop compare it with what
  you observe right now, not with what you think happened.
- Make each action safe to run twice.
- Report what you observed into status so other loops and people can
  see it.
- The same idea shows up outside Kubernetes, in
  [[infrastructure-as-code]] tools that compare declared resources with
  what exists.

## Further reading

- [Controllers](https://kubernetes.io/docs/concepts/architecture/controller/), Kubernetes documentation, Kubernetes 1.37. The thermostat, desired vs current state, and controllers that work through the API server.
- [Writing Controllers](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-api-machinery/controllers.md), Kubernetes SIG API Machinery. The three-line loop and the rules real controllers follow: level driven, caches, other actors, retries.
- [API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md), Kubernetes SIG Architecture. Spec and status, and why the system is level-based rather than edge-based.
