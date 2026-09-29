---
id: terraform-resource-drift
title: Manage resource drift (Terraform tutorial)
author: HashiCorp
url: https://developer.hashicorp.com/terraform/tutorials/state/resource-drift
kind: docs
primary: true
---

## Summary

HashiCorp's tutorial on drift: create an EC2 instance and security
group with Terraform, change them by hand with the AWS CLI, then find
the drift with a refresh-only plan and bring the hand-made group under
management with import.

## Key claims

- Drift is when state no longer matches real infrastructure after manual changes. "You should not make manual changes to resources controlled by Terraform, because the state file will be out of sync, or "drift," from the real infrastructure." (intro)
- Terraform then tries to reconcile, which can destroy things. "If your state and configuration do not match your infrastructure, Terraform will attempt to reconcile your infrastructure, which may unintentionally destroy or recreate resources." (intro)
- Plan and apply compare state with reality every time. "By default, Terraform compares your state file to real infrastructure whenever you invoke terraform plan or terraform apply." (Run a refresh-only plan)
- A refresh-only plan shows the drift without touching infrastructure. "A refresh-only operation does not attempt to modify your infrastructure to match your Terraform configuration -- it only gives you the option to review and track the drift in your state file." (Run a refresh-only plan)
- A normal apply would undo the hand change. "If you ran terraform plan or terraform apply without the -refresh-only flag now, Terraform would attempt to revert your manual changes." (Run a refresh-only plan)
- Continuous drift detection is a paid HCP Terraform feature. "Drift detection is available in HCP Terraform Standard Edition." (note)
- The old refresh subcommand overwrote state without showing the change. "This is safer than the refresh subcommand , which automatically overwrites your state file without displaying the updates." (Run a refresh-only plan)
- Refresh-only is preferred since 0.15.4. "The -refresh-only flag was introduced in Terraform 0.15.4, and is preferred over the terraform refresh subcommand." (Run a refresh-only plan, tip)

## Visuals worth redrawing

- The three-way picture: configuration, state, real infrastructure,
  and which command moves which.

## My notes

- Refresh-only was added in Terraform 0.15.4 and replaces the old
  `terraform refresh` command.
