---
id: grafana-red-method-2018
title: "The RED Method: How to Instrument Your Services"
author: Julie Dam (Grafana Labs), reporting Tom Wilkie's talk
url: https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/
kind: blog
primary: false
---

## Summary

A Grafana Labs write-up (2018) of Tom Wilkie's talk introducing the RED
method, which he created in 2015: for every service, track the request
rate, the errors and the duration. It sets RED beside the USE method and
Google's four golden signals, with Wilkie's reasons quoted. Written by a
Grafana staffer, not by Wilkie, so marked not primary, though the quotes
are his.

## Key claims

- Wilkie created RED in 2015. "his popular talk about the RED Method of monitoring microservices, which he created in 2015." (intro)
- Rate definition. "Rate (the number of requests per second)" (The RED Method)
- Errors definition. "Errors (the number of those requests that are failing)" (The RED Method)
- Duration definition. "Duration (the amount of time those requests take)" (The RED Method)
- Why he made it: USE fits hardware, not services. "The USE Method doesn’t really apply to services; it applies to hardware, network disks, things like this" (The RED Method, Wilkie quoted)
- USE is hard to apply to memory. "Memory utilization is tricky. What is it? Do you count caches toward utilization?" (The USE Method, Wilkie quoted)
- Duration should be a distribution, not one number. "Everyone should understand the error rate, the request rate, and then some distribution of latency for those requests" (The RED Method, Wilkie quoted)
- Same three for every service gives a consistent view and lets people go on call for code they didn't write. "allows you to put people on call for code they didn’t write." (The RED Method, Wilkie quoted)
- RED approximates user happiness and suits alerts and SLAs. "The RED Method is a good proxy to how happy your customers will be." (The RED Method, Wilkie quoted)
- Four golden signals are RED plus saturation. "This is basically the same as the RED Method, but includes saturation." (The Four Golden Signals)
- One way to measure a service's saturation: CPU used against its quota, as a fraction. (The Four Golden Signals, Wilkie on kube-state-metrics)
- Use both methods: RED for users, USE for machines. "the RED Method is about caring about your users and how happy they are" (Two Sides of the Same Coin, Wilkie quoted)
- The same three for every service gives one consistent view. "You model this for every single service in your architecture, and this gives you a nice, consistent view of how your architecture is behaving." (The RED Method, Wilkie quoted)
- Good for alerts and SLAs. "So these are really good metrics for building meaningful alerts and measuring your SLA." (The RED Method, Wilkie quoted)

## Visuals worth redrawing

None.

## My notes

- Grafana's dashboard best-practices docs say the same thing more
  bluntly (USE reports causes, RED reports symptoms, alert on RED).
  Opened, not given a note.
- The blog URL path carries a publication day; the note gives only the
  year.
