---
id: terraform-state
title: State (Terraform language docs)
author: HashiCorp
url: https://developer.hashicorp.com/terraform/language/state
kind: docs
primary: true
---

## Summary

The Terraform docs page on state, read when v1.16 was the latest
release: what the state file is for, where it's stored by default, and
the one-to-one rule between resource instances and real objects.

## Key claims

- State maps real resources to the configuration. "Terraform uses your workspace's state to map real world resources to your configuration, keep track of metadata, and to improve performance for large infrastructures." (intro)
- Terraform refreshes state before any operation. "Prior to any operation, Terraform does a refresh to update the state with the real infrastructure." (intro)
- The state stores bindings between remote objects and resource instances. "The primary purpose of Terraform state is to store bindings between objects in a remote system and resource instances declared in your configuration." (intro)
- Default is a local file. "By default, Terraform stores each workspace's state in a local file named terraform.tfstate" (intro)
- Don't keep state in version control: no locking, and secrets end up in it. "Avoid storing your state in a version control system or other storage solution that does not support Terraform state locking and secure access control, because doing so can result in data loss or exposure of secrets stored in the state file." (intro)
- Don't edit the JSON by hand. "Terraform stores your workspaces state as a JSON text file. Do not directly edit this file." (intro)
- One remote object per resource instance. "Terraform expects a one-to-one mapping between configured resource instances and remote objects." (intro)
- Terraform keeps the one-to-one rule for objects it creates; after import or state rm it's on you. "If you add or remove bindings in the state by other means, such as by importing externally-created objects with terraform import , or by asking Terraform to "forget" an existing object with terraform state rm , you'll then need to ensure for yourself that this one-to-one rule is followed" (intro)

## Visuals worth redrawing

None.

## My notes

- Pair with terraform-state-purpose for the why.
