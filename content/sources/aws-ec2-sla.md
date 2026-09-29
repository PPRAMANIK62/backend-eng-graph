---
id: aws-ec2-sla
title: Amazon Compute Service Level Agreement
author: Amazon Web Services
url: https://aws.amazon.com/compute/sla/
kind: docs
primary: true
---

## Summary

The public SLA for Amazon EC2, as published when this was written. A
real example of an SLA: two commitments (region-level and
instance-level), what counts as unavailable, how uptime is computed,
and what you get when AWS misses it (service credits, which you have
to claim).

## Key claims

- Region-level: at least 99.99% monthly uptime for instances spread over two or more AZs. "AWS will use commercially reasonable efforts to make Amazon EC2 available for each AWS region with a Monthly Uptime Percentage of at least 99.99%" (Region-Level SLA)
- Region-level credits: 10% below 99.99%, 30% below 99.0%, 100% below 95.0%. (Region-Level SLA table)
- Instance-level: at least 99.5% for a single instance. "make the Single EC2 Instance available with an Instance-Level Uptime Percentage of at least 99.5%" (Instance-Level SLA)
- Credits are a share of the monthly bill, applied to future payments, not a refund. "Service Credits will not entitle you to any refund or other payment from AWS." (SLA Credits)
- You must file a claim, with your own request logs as evidence. "your request logs that document the errors and corroborate your claimed outage" (Credit Request and Payment Procedures)
- Credits are the sole remedy. "this SLA sets forth your sole and exclusive remedies" (Credit Request and Payment Procedures)
- Exclusions include problems outside AWS's control and your own actions. "caused by factors outside of our reasonable control" (Amazon Compute SLA Exclusions)
- Uptime is computed per minute. "“Monthly Uptime Percentage” is calculated by subtracting from 100% the percentage of minutes during the month in which Amazon EC2 was in the state of Unavailability." (SLA Definitions)
- Region-level unavailable means all your instances in two or more AZs have no external connectivity at once. "when all of your running instances deployed in two or more AZs in the same AWS region (or, if there is only one AZ in the AWS region, that AZ and an AZ in another AWS region) concurrently have no external connectivity." (SLA Definitions)
- For one instance, unavailable means no external connectivity. "For the Instance-Level SLA, your Single EC2 Instance has no external connectivity." (SLA Definitions)

## Visuals worth redrawing

None.

## My notes

- The page shows a "last updated" line; terms change, so re-open it
  before quoting numbers.
- Notice how narrow "unavailable" is: slow, erroring or partly broken
  doesn't count, only no connectivity.
