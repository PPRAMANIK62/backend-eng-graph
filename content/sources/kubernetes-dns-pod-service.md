---
id: kubernetes-dns-pod-service
title: DNS for Services and Pods
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/
kind: docs
primary: true
---

## Summary

How cluster DNS names work (docs for Kubernetes 1.37). Services get
names like my-svc.my-namespace.svc.cluster.local, the kubelet writes each
Pod's /etc/resolv.conf with a search list and ndots:5, a normal Service
name resolves to its cluster IP, and a headless one to its Pod IPs.

## Key claims

- The kubelet sets up each Pod's DNS. "kubelet configures Pods' DNS so that running containers can look up Services by name rather than IP." (intro)
- The search list includes the Pod's namespace. "By default, a client Pod's DNS search list includes the Pod's own namespace and the cluster's default domain." (intro)
- Names without a namespace are looked up in the Pod's namespace. "DNS queries that don't specify a namespace are limited to the Pod's namespace." (Namespaces of Services)
- Short names are expanded with the search list. "For example, a query for just data may be expanded to data.test.svc.cluster.local." (Namespaces of Services)
- The example resolv.conf has ndots:5. "options ndots:5" (Namespaces of Services, example)
- A normal Service resolves to its cluster IP. "This resolves to the cluster IP of the Service." (Services, A/AAAA records)
- A headless Service resolves to the Pod IPs. "Unlike normal Services, this resolves to the set of IPs of all of the Pods selected by the Service." (Services, A/AAAA records)
- SRV records for named ports. "SRV Records are created for named ports that are part of normal or headless services." (SRV records)
- The Service name form. "with a name of the form my-svc.my-namespace.svc.cluster-domain.example. This resolves to the cluster IP of the Service." (Services, A/AAAA records)
- From another namespace, name the namespace too. "A query for data.prod returns the intended result, because it specifies the namespace." (Namespaces of Services)

## Visuals worth redrawing

None.

## My notes

- The page shows ndots:5 but doesn't explain the cost. With the
  resolv.conf rule (man7-resolv-conf), any name with fewer than 5 dots,
  like api.example.com, is tried with each search domain first.
