---
id: sato-parallel-change-2014
title: ParallelChange
author: Danilo Sato (martinfowler.com)
url: https://martinfowler.com/bliki/ParallelChange.html
kind: blog
primary: true
---

## Summary

The short article (2014) that names parallel change, also called expand
and contract: make a backward-incompatible change in three phases so
old and new users keep working the whole time. Uses a code example,
then lists database refactoring, deployments and remote APIs as other
uses.

## Key claims

- The pattern and its three phases. "Parallel change, also known as expand and contract, is a pattern to implement backward-incompatible changes to an interface in a safe manner, by breaking the change into three distinct phases: expand, migrate, and contract." (intro)
- Expand supports both versions. "In the expand phase you augment the interface to support both the old and the new versions." (expand)
- Migrate moves every user across, possibly slowly. "During the migrate phase you update all clients using the old version to the new version." (migrate)
- Contract removes the old version. "Once all usages have been migrated to the new version, you perform the contract phase to remove the old version and change the interface so that it only supports the new version." (contract)
- Each phase can be released on its own. "it allows your code to be released in any of these three phases." (why)
- Most database refactorings follow it; the migrate phase is when both schemas exist. "Most database refactorings follow the parallel change pattern, where the migrate phase is the transition period between the original and the new schema, until all database access code has been updated to work with the new schema." (examples)
- The cost: two versions to support, and skipping contract leaves you worse off. "If the contract phase is not executed you might end up in a worse state than you started, therefore you need discipline to finish the transition successfully." (downside)

## Visuals worth redrawing

None on the page. The three phases as columns is an easy redraw.

## My notes

- Also mentions feature flags during the migrate phase, and remote API
  evolution as an alternative to explicit versions.
