---
id: kubernetes-controllers
title: Controllers (Kubernetes concepts)
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/architecture/controller/
kind: docs
primary: true
---

## Summary

The Kubernetes docs page on controllers (docs for Kubernetes 1.37). It
starts from a thermostat: you set a desired temperature, the room has a
current one, and the thermostat acts to close the gap. Kubernetes
controllers do the same for cluster state, mostly by writing to the API
server rather than acting directly.

## Key claims

- A control loop never ends. "In robotics and automation, a control loop is a non-terminating loop that regulates the state of a system." (Controllers)
- The thermostat example: desired vs current state. "The thermostat acts to bring the current state closer to the desired state, by turning equipment on or off." (Controllers)
- Controllers watch cluster state and make or request changes. "In Kubernetes, controllers are control loops that watch the state of your cluster, then make or request changes where needed." (Controllers)
- The spec field holds desired state. "These objects have a spec field that represents the desired state." (Controller pattern)
- Most controllers act by sending messages to the API server. "more commonly, in Kubernetes, a controller will send messages to the API server that have useful side effects." (Controller pattern)
- The Job controller doesn't run Pods itself. "Instead, the Job controller tells the API server to create or remove Pods." (Control via API server)
- Controllers report back what they did. "the controller makes some changes to bring about your desired state, and then reports the current state back to your cluster's API server." (Direct control)
- The cluster may never be stable, and that's fine. "This means that, potentially, your cluster never reaches a stable state." (Desired versus current state)
- Many small controllers, not one big loop. "It's useful to have simple controllers rather than one, monolithic set of control loops that are interlinked." (Design)
- Labels keep controllers from fighting over each other's objects. "The Job controller does not delete the Pods that your Deployment created, because there is information (labels) the controllers can use to tell those Pods apart." (Design, note)
- Built-in controllers run in kube-controller-manager. "Kubernetes comes with a set of built-in controllers that run inside the kube-controller-manager." (Ways of running controllers)
- Scheduled Pods become the kubelet's desired state. "(Once scheduled, Pod objects become part of the desired state for a kubelet)." (Control via API server)
- Other control plane components schedule and run the Pods the Job controller asked for. "Other components in the control plane act on the new information (there are new Pods to schedule and run), and eventually the work is done." (Control via API server)

## Visuals worth redrawing

- The thermostat loop: desired temperature, measured temperature, heater.

## My notes

- Direct control example: a controller that adds nodes talks to an outside
  system (a cloud API), then reports back.
