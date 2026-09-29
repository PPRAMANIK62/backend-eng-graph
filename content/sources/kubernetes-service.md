---
id: kubernetes-service
title: Service (Kubernetes concepts)
author: Kubernetes documentation
url: https://kubernetes.io/docs/concepts/services-networking/service/
kind: docs
primary: true
---

## Summary

How Kubernetes gives a changing set of Pods one stable name (docs for
Kubernetes 1.37): a Service selects Pods, a controller keeps
EndpointSlices up to date, clients find it by DNS or environment
variables, and either reach a virtual cluster IP or, for headless
Services, the Pod IPs directly.

## Key claims

- Pods come and go, so their addresses can't be hard-coded. "Pods are ephemeral resources (you should not expect that an individual Pod is reliable and durable)." (intro)
- The problem stated. "how do the frontends find out and keep track of which IP address to connect to, so that the frontend can use the backend part of the workload?" (intro)
- A controller keeps the endpoint list current. "The controller for that Service continuously scans for Pods that match its selector, and then makes any necessary updates to the set of EndpointSlices for the Service." (Defining a Service)
- A normal Service gets a cluster IP served by a virtual IP mechanism. "Kubernetes assigns this Service an IP address (the cluster IP), that is used by the virtual IP address mechanism." (Defining a Service)
- Clients can also query the API directly. "If you're able to use Kubernetes APIs for service discovery in your application, you can query the API server for matching EndpointSlices." (Cloud-native service discovery)
- EndpointSlices hold up to 100 endpoints each by default. "By default, Kubernetes makes a new EndpointSlice once the existing EndpointSlices all contain at least 100 endpoints." (EndpointSlices)
- Two ways to find a Service: environment variables and DNS. "Kubernetes supports two primary modes of finding a Service: environment variables and DNS." (Discovering services)
- Environment variables only exist if the Service was created before the Pod. "you must create the Service before the client Pods come into existence." (Environment variables)
- A cluster DNS server watches the API and makes records per Service. "A cluster-aware DNS server, such as CoreDNS, watches the Kubernetes API for new Services and creates a set of DNS records for each one." (DNS)
- Pods in the same namespace can use the short name; others add the namespace. "Pods in the my-ns namespace should be able to find the service by doing a name lookup for my-service (my-service.my-ns would also work)." (DNS)
- SRV records for named ports. "you can do a DNS SRV query for _http._tcp.my-service.my-ns to discover the port number for http, as well as the IP address." (DNS)
- Headless Services skip the virtual IP and return Pod IPs in DNS. "For headless Services, a cluster IP is not allocated, kube-proxy does not handle these Services, and there is no load balancing or proxying done by the platform for them." (Headless Services)
- They return A/AAAA records pointing at the Pods. "modifies the DNS configuration to return A or AAAA records (IPv4 or IPv6 addresses) that point directly to the Pods backing the Service." (Headless Services, With selectors)
- (Service types) ClusterIP. "Exposes the Service on a cluster-internal IP. Choosing this value makes the Service only reachable from within the cluster." (Service type)
- ClusterIP is the default. "This is the default that is used if you don't explicitly specify a type for a Service." (Service type)
- Exposing it publicly goes through Ingress or Gateway. "You can expose the Service to the public internet using an Ingress or a Gateway." (Service type)
- NodePort. "Exposes the Service on each Node's IP at a static port (the NodePort)." (Service type)
- NodePort builds on a cluster IP. "To make the node port available, Kubernetes sets up a cluster IP address, the same as if you had requested a Service of type: ClusterIP." (Service type)
- The NodePort range. "the Kubernetes control plane allocates a port from a range specified by --service-node-port-range flag (default: 30000-32767)." (type: NodePort)
- Every node proxies it. "Each node proxies that port (the same port number on every Node) into your Service." (type: NodePort)
- LoadBalancer needs an outside load balancer. "Kubernetes does not directly offer a load balancing component; you must provide one, or you can integrate your Kubernetes cluster with a cloud provider." (Service type)
- ExternalName is just DNS. "The mapping configures your cluster's DNS server to return a CNAME record with that external hostname value. No proxying of any kind is set up." (Service type)
- The types nest. "The type field in the Service API is designed as nested functionality - each level adds to the previous." (Service type)

## Visuals worth redrawing

None.

## My notes

- A normal Service is server-side discovery (a virtual IP and
  kube-proxy); a headless Service is client-side.
