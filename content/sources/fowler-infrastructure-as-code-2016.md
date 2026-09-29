---
id: fowler-infrastructure-as-code-2016
title: InfrastructureAsCode
author: Martin Fowler
url: https://martinfowler.com/bliki/InfrastructureAsCode.html
kind: blog
primary: false
---

## Summary

Short bliki entry (2016) defining infrastructure as code and listing
its practices, taken from Kief Morris's book *Infrastructure as Code*.

## Key claims

- Definition: infrastructure defined in source code and treated like any software. "Infrastructure as code is the approach to defining computing and network infrastructure through source code that can then be treated just like any software system." (definition)
- No hand edits on servers. "At no time should anyone log into a server and make on-the-fly adjustments." (Use Definition Files)
- Hand tinkering creates snowflake servers. "Any such tinkering risks creating SnowflakeServers" (Use Definition Files)
- Version everything so every change is recorded. "Keep all this code in source control. That way every configuration and every change is recorded for audit" (Version all the things)
- Infrastructure code can have its own deployment pipeline. "you can set up DeploymentPipelines for your infrastructure code" (Continuously test systems and processes)
- Small changes are easier to find errors in and revert. "Small updates make it easier to find errors and are easier to revert." (Small changes rather than batches)
- Code-built servers are consistent; manual ones drift apart. "With manual provisioning different interpretations of imprecise instructions (let alone errors) lead to snowflakes with subtly different configurations" (Benefits)
- At worst you revert. "at worst changes can be reverted to the last working configuration." (Benefits)

## Visuals worth redrawing

None.

## My notes

- The practices list is credited to Kief Morris's book, which wasn't
  opened.
