---
id: aws-fis-what-is
title: What is AWS Fault Injection Service?
author: Amazon Web Services
url: https://docs.aws.amazon.com/fis/latest/userguide/what-is.html
kind: docs
primary: true
---

## Summary

The overview page of AWS FIS, a managed fault injection service. Useful
here for its experiment template: actions, targets, and stop conditions
that halt an experiment when an alarm fires.

## Key claims

- FIS runs fault injection experiments based on chaos engineering. "Fault injection is based on the principles of chaos engineering." (What is AWS Fault Injection Service?)
- It provides guardrails to run in production, including automatic stop or rollback. "AWS FIS provides templates that generate disruptions, and the controls and guardrails that you need to run experiments in production, such as automatically rolling back or stopping the experiment if specific conditions are met." (What is AWS Fault Injection Service?)
- AWS still recommends planning and pre-production runs first. "before you use AWS FIS to run experiments in production, we strongly recommend that you complete a planning phase and run the experiments in a pre-production environment." (Important)
- An experiment template holds actions, targets and stop conditions. "It contains the actions, targets, and stop conditions for the experiment." (AWS FIS concepts)
- A stop condition is an alarm threshold that stops the experiment. "A stop condition is a mechanism to stop an experiment if it reaches a threshold that you define as an Amazon CloudWatch alarm." (Stop conditions)
- Each action runs for a set duration or until stopped. "Each action runs for a specified duration during an experiment, or until you stop the experiment." (Actions)

## Visuals worth redrawing

- The components of an experiment template (actions, targets, stop conditions).

## My notes

- AWS-specific, but the template is a clean general shape for any harness.
