---
id: google-sre-availability-table
title: Availability Table (Site Reliability Engineering, appendix A)
author: Google SRE (edited by Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Murphy)
url: https://sre.google/sre-book/availability-table/
kind: book
primary: true
---

## Summary

Appendix A of Google's SRE book (2016). One table: how much downtime
each availability level allows per year, quarter, month, week, day and
hour, assuming no planned downtime. Plus a note on why a request-based
measure beats outage length for partly-up services.

## Key claims

- The table assumes no planned downtime. "Assuming no planned downtime, Table 1-1 indicates how much downtime is permitted to reach a given availability level." (intro)
- Rows used (per year / per month / per day), copied from Table 1-1:
  - 99%: 3.65 days / 7.2 hours / 14.4 minutes
  - 99.9%: 8.76 hours / 43.2 minutes / 1.44 minutes
  - 99.95%: 4.38 hours / 21.6 minutes / 43.2 seconds
  - 99.99%: 52.6 minutes / 4.32 minutes / 8.64 seconds
  - 99.999%: 5.26 minutes / 25.9 seconds / 0.87 seconds
- 99.99% allows 12.96 minutes a quarter and 60.5 seconds a week; 99.9% allows 2.16 hours a quarter and 10.1 minutes a week. (Table 1-1)
- A failed-operations ratio is more useful than outage length when a service is partly up or its load varies. "is more useful than focusing on outage lengths for services that may be partially available—for instance, due to having multiple replicas, only some of which are unavailable—and for services whose load varies over the course of a day or week rather than remaining constant." (after the table)

## Visuals worth redrawing

- The table itself, cut down to a few rows.

## My notes

- The month column uses a 30-day month (43.2 minutes for 99.9% is 0.1%
  of 43,200 minutes).
