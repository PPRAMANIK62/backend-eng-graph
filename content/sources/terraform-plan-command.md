---
id: terraform-plan-command
title: terraform plan command
author: HashiCorp
url: https://developer.hashicorp.com/terraform/cli/commands/plan
kind: docs
primary: true
---

## Summary

The CLI reference for `terraform plan`, read when v1.16 was the latest
release: the three steps of planning, speculative vs saved plans,
planning modes, and options such as `-refresh=false` and
`-detailed-exitcode`.

## Key claims

- A plan previews changes. "The terraform plan command creates an execution plan, which lets you preview the changes that Terraform plans to make to your infrastructure." (intro)
- Step 1: read current remote objects. "Reads the current state of any already-existing remote objects to make sure that the Terraform state is up-to-date." (Introduction)
- Step 2: compare config with prior state. "Compares the current configuration to the prior state and noting any differences." (Introduction)
- Step 3: propose actions. "Proposes a set of change actions that should, if applied, make the remote objects match the configuration." (Introduction)
- Plan alone changes nothing. "The plan command alone does not actually carry out the proposed changes" (Introduction)
- A saved plan can be applied later. "You can use the optional -out=FILE option to save the generated plan to a file on disk, which you can later execute by passing the file to terraform apply as an extra argument." (Introduction)
- An earlier speculative plan can go stale. "other changes made to the target system in the meantime might cause the final effect of a configuration change to be different than what an earlier speculative plan indicated" (Introduction)
- Refresh-only mode updates state to match reality, without changing infrastructure; since v0.15.4. "Refresh-only mode: creates a plan whose goal is only to update the Terraform state and any root module output values to match changes made to remote objects outside of Terraform." (Planning Modes)
- Skipping refresh can give a wrong plan. "setting refresh=false causes Terraform to ignore external changes, which could result in an incomplete or incorrect plan." (Planning Options)
- `-detailed-exitcode`: 0 no changes, 1 error, 2 changes present. (Other Options)
- Turning off the lock is dangerous. "This is dangerous if others might concurrently run commands against the same workspace." (-lock=false)
- Saved plans are meant for automation. "This two-step workflow is primarily intended for when running Terraform in automation." (Introduction)
- Refresh-only needs v0.15.4. "The -refresh-only option is available only in Terraform v0.15.4 and later." (Planning Modes)
- -target is for exceptions, not routine use. "It is not recommended to use -target for routine operations, since this can lead to undetected configuration drift" (Resource Targeting)
- Plan output symbols. "Resource actions are indicated with the following symbols: + create ~ update in-place - destroy -/+ destroy and then create replacement" (example plan output)

## Visuals worth redrawing

None.

## My notes

- `-detailed-exitcode` exit 2 is how a scheduled job can detect drift
  without HCP Terraform's paid feature.
