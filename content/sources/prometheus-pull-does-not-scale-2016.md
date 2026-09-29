---
id: prometheus-pull-does-not-scale-2016
title: Pull doesn't scale - or does it?
author: Julius Volz (Prometheus)
url: https://prometheus.io/blog/2016/07/23/pull-does-not-scale-or-does-it/
kind: blog
primary: true
---

## Summary

A Prometheus blog post (2016) by one of its founders answering the
claim that pull-based metrics collection can't scale. Its argument: the
cost is in ingesting and storing samples, not in who opens the
connection; Prometheus collects current state, not events, so pulling
is cheap; and a monitoring system has to know what should exist anyway.

## Key claims

- Who opens the connection doesn't matter for scale. "For scaling purposes, it doesn't matter who initiates the TCP connection over which metrics are then transferred." (It doesn't matter who initiates the connection)
- The bottleneck is ingesting and storing, not pulling. "The scaling bottleneck here has never been related to pulling metrics, but usually to the speed at which the Prometheus server can ingest the data into memory and then sustainably persist and expire data on disk/SSD." (It doesn't matter who initiates the connection)
- A record of 800,000 samples per second on one server, measured at SoundCloud. "with a record of 800,000 incoming samples per second (as measured with real production metrics data at SoundCloud)." (It doesn't matter who initiates the connection)
- With a 10 s interval and 700 series per host, that's over 10,000 machines. "Given a 10-seconds scrape interval and 700 time series per host, this allows you to monitor over 10,000 machines from a single Prometheus server." (It doesn't matter who initiates the connection)
- Pull over TCP makes a failed transfer visible. "using a TCP-based pull approach makes sure that metrics data arrives reliably, or that the monitoring system at least knows immediately when the metrics transfer fails due to a broken network." (It doesn't matter who initiates the connection)
- Prometheus isn't event-based: it collects aggregated time series. "Prometheus is in the business of collecting aggregated time series data." (Prometheus is not an event-based system)
- The service counts in memory; Prometheus asks for the current value periodically. "an instrumented service would not send a message about each HTTP request to Prometheus as it is handled, but would simply count up those requests in memory." (Prometheus is not an event-based system)
- Scrapes every 15 or 30 seconds, or as configured. "Prometheus then simply asks the service instance every 15 or 30 seconds (or whatever you configure) about the current counter value" (Prometheus is not an event-based system)
- Event systems like StatsD aggregate centrally; pulling events would need buffering. "This central system then either aggregates the events into metrics (StatsD is the prime example of this) or stores events individually for later processing" (Prometheus is not an event-based system)
- Monitoring must know which instances should exist anyway. "if your monitoring system doesn't know what the world should look like and which monitored service instances should be there, how would it be able to tell when an instance just never reports in" (But now my monitoring needs to know about my service instances!)
- Pull lets you run a copy of monitoring on a laptop, and two servers for high availability. "To get high availability, pull allows you to just run two identically configured Prometheus servers in parallel." (But now my monitoring needs to know about my service instances!)
- Push makes it slightly more likely that rogue jobs flood monitoring. "in our experience it's slightly more likely for a push-based approach to accidentally bring down your monitoring." (Accidentally DDoS-ing your monitoring)
- Prometheus was inspired by Google's pull-based Borgmon. "Prometheus was inspired by Google's Borgmon, which was (and partially still is) used within Google to monitor all its critical production services using a pull-based approach." (Real-world proof)
- Pull is hard when targets sit behind firewalls. "these remaining concerns about pull-based monitoring are usually not scaling-related, but due to network operation difficulties around opening TCP connections." (But there are other problems with pull!)
- Targets come from built-in service discovery. "Prometheus makes it easy to configure the desired state of the world with its built-in support for a wide variety of service discovery mechanisms" (But now my monitoring needs to know about my service instances!)
- With pull you can run a copy of production monitoring on a laptop. "With pull, you can just run a copy of production monitoring on your laptop to experiment with it." (But now my monitoring needs to know about my service instances!)

## Visuals worth redrawing

None.

## My notes

- The 800,000 samples/s figure is a record from SoundCloud when the post
  was written (2016); newer versions will differ.
