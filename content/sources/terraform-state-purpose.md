---
id: terraform-state-purpose
title: Purpose of Terraform State
author: HashiCorp
url: https://developer.hashicorp.com/terraform/language/state/purpose
kind: docs
primary: true
---

## Summary

Why Terraform can't work without a state file: mapping config to real
objects, remembering dependencies for deletes, caching attributes for
speed, and syncing a team through remote state with locking.

## Key claims

- State is required. "State is a necessary requirement for Terraform to function." (intro)
- Example of the mapping. "represents a real world object with the instance ID i-abcd1234 on a remote system." (the resource is aws_instance.foo) (Mapping to the Real World)
- Early prototypes used cloud tags instead, and it didn't work. "Early prototypes of Terraform actually had no state files and used this method." (Mapping to the Real World)
- Not every resource supports tags. "not all resources support tags, and not all cloud providers support tags." (Mapping to the Real World)
- State remembers dependencies so a resource removed from config can still be destroyed in order. "Terraform retains a copy of the most recent set of dependencies within the state." (Metadata)
- Refreshing is slow at scale: hundreds of milliseconds per resource, plus rate limits. "the round trip time for each resource is hundreds of milliseconds" (Performance)
- Big users skip the refresh and trust the cache. "In these scenarios, the cached state is treated as the record of truth." (Performance)
- Remote state with locking stops two runs at once. "Terraform can use remote locking as a measure to avoid two or more different users accidentally running Terraform at the same time" (Syncing)
- Large users skip refresh or target a subset. "Larger users of Terraform make heavy use of the -refresh=false flag as well as the -target flag in order to work around this." (Performance)

## Visuals worth redrawing

None.

## My notes

- The performance argument explains why big teams end up trusting a
  cached state that can drift.
