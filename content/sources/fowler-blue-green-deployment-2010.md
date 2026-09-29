---
id: fowler-blue-green-deployment-2010
title: BlueGreenDeployment
author: Martin Fowler
url: https://martinfowler.com/bliki/BlueGreenDeployment.html
kind: blog
primary: false
---

## Summary

Short bliki entry (2010, database paragraph added 2015) describing
blue-green deployment, from Humble and Farley's *Continuous Delivery*.

## Key claims

- Two production environments, one live. "The blue-green deployment approach does this by ensuring you have two production environments, as identical as possible." (second paragraph)
- Cut over by switching the router. "Once the software is working in the green environment, you switch the router so that all incoming requests go to the green environment - the blue one is now idle." (second paragraph)
- Rollback is switching back. "if anything goes wrong you switch the router back to your blue environment." (third paragraph)
- Transactions during the green period are the open problem. "There's still the issue of dealing with missed transactions while the green environment was live" (third paragraph)
- The same mechanism tests a hot standby. "Hence this allows you to test your disaster-recovery procedure on every release." (advantage)
- Separate schema changes from app upgrades. "The trick is to separate the deployment of schema changes from application upgrades." (databases)
- The idle environment becomes staging for the next release. "you then use the blue environment as your staging environment for the final testing step for your next deployment." (after the cut-over)
- Schema first, in a form both versions support. "So first apply a database refactoring to change the schema to support both the new and old version of the application, deploy that, check everything is working fine" (databases)

## Visuals worth redrawing

- Router pointing at one of two identical environments.

## My notes

- Credits the name to Daniel Terhorst-North and Jez Humble.
