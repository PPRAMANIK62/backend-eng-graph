---
id: infrastructure-as-code
title: Infrastructure as code
depth: deep
phase: 14
note: >-
  Declaring infrastructure in files. Terraform's plan, state and drift.
needs: [control-loops]
leads_to: []
compare_with: [kubernetes]
---

# Infrastructure as code

Infrastructure as code means your servers, networks, databases and DNS
records are described in files, kept in version control, and created
by a tool that reads those files, not by someone clicking in a cloud
console. You get review, history and repeatability for infrastructure,
the same way you have them for code. You also get a new problem: the
tool's idea of what exists can drift away from what really exists.

## From clicks to a file

Say the order service needs a virtual machine, a security group that
lets traffic in on port 443, and a DNS name. You could create all
three by hand in the console. It works once. Then someone changes the
security group during an incident, someone else builds a staging copy
from memory, and six months later nobody knows why production and
staging behave differently. Servers built by hand this way are called
snowflake servers: each one is slightly different, and nobody can say
exactly how.

The alternative is to write it down:

```hcl
resource "aws_instance" "orders" {
  instance_type          = "t3.small"
  vpc_security_group_ids = [aws_security_group.orders_https.id]
}
```

Now the definition lives in the repository. A change is a pull request
someone reviews. History shows who changed what and when. A new
environment is the same files run again. The practices that come with
this are the ones from [[ci-cd]]: keep everything in version control,
test it, make small changes, and never log into a server to fix it by
hand, because that fix exists nowhere but on that server.

The files are **declarative**: they describe what should exist, not
the steps to create it. Working out the steps is the tool's job. This
article uses Terraform (and its fork OpenTofu) as the example; the
ideas carry over to other tools.

## Three versions of the truth

When you run `terraform plan`, Terraform is juggling three pictures of
your infrastructure:

![Three boxes in a row: the configuration (.tf files in Git, what you want), the state file (what Terraform last recorded, with resource IDs and dependencies), and the real infrastructure (what the cloud API reports). Step 1, refresh: read every real object and update state. Step 2, diff: compare configuration with the refreshed state. Step 3, the plan lists create, update, replace and destroy actions. Apply then calls the cloud API and writes the new state. A dashed arrow marks drift: someone changed the real infrastructure by hand, outside Terraform.](img/infrastructure-as-code-plan.svg)

*What `terraform plan` compares, and where drift comes from. Adapted from the Terraform docs on plan and state.*

1. **Refresh.** Read the current settings of every real object it
   manages and update its state to match.
2. **Diff.** Compare the configuration with that refreshed state.
3. **Propose.** List the actions (create, update, replace, destroy)
   that would make reality match the configuration.

A plan on its own changes nothing. You read it, a reviewer reads it,
and `terraform apply` carries it out. You can save a plan with `-out`
and apply exactly that plan later, which is what automated pipelines
do. A plan run earlier during code review is only a preview: if
something else changes in the meantime, the final plan can differ, so
the plan to trust is the one made right before apply.

This is a [[control-loops|control loop]] with a human in the middle:
compare desired state with actual state, work out the difference, act.

## Why there's a state file

If Terraform can read the real infrastructure, why keep a state file
at all? Three reasons:

- **Mapping.** Your config says `aws_instance.orders`. The cloud knows
  an instance called `i-abcd1234`. Something has to remember that
  these are the same thing. Early Terraform prototypes tried using
  cloud tags for this instead of a file, and dropped the idea, because
  not every resource and not every provider supports tags.
- **Deletes.** When you remove a resource from the config, Terraform
  must destroy it, in the right order relative to other resources. The
  config no longer says anything about it, so the dependencies have to
  come from the state.
- **Speed.** Reading every resource can take hundreds of milliseconds
  per resource, and cloud APIs rate-limit you. The state doubles as a
  cache of every attribute.

Each real object must be bound to exactly one resource in the
config. Terraform guarantees that for what it creates. If you import
existing objects or tell Terraform to forget one, keeping the mapping
one-to-one becomes your job.

## Drift

Drift is when real infrastructure no longer matches what the state
says, usually because someone changed it by hand. Say during an
incident an engineer swaps the instance's security group for one that
opens port 8080. The next normal `terraform plan` refreshes, sees the
difference, and proposes to undo the hand change, since the config
still says port 443. If that engineer's change was keeping the service
up, the next apply takes it down again. Drift can also lead Terraform
to destroy and recreate resources you didn't expect it to touch.

You have three options when you find drift:

- **Revert it**: apply the config as it is.
- **Keep it**: change the config to match, and import anything created
  by hand so Terraform manages it.
- **Look first**: `terraform plan -refresh-only` (Terraform 0.15.4 and
  later) shows what changed outside Terraform and updates only the
  state, never the infrastructure.

Terraform only notices drift when someone runs it. Nothing is watching
in between. A scheduled `terraform plan -detailed-exitcode` in CI
turns that into a check: exit code 0 means no changes, 2 means the
real world and the config disagree. HashiCorp sells continuous drift
detection as part of its paid HCP Terraform offering.

## Run when asked, or run forever

This is the real split between infrastructure-as-code tools.
Terraform reconciles once, when a person or pipeline runs it. The
other model reconciles continuously: a software agent watches actual
state and keeps pushing it toward desired state, whether or not anyone
asked. That's the same control loop, running on its own.

GitOps is the name for the second model. Its four principles are that
desired state is declarative, versioned and immutable, pulled
automatically by software agents, and continuously reconciled. Under
GitOps a hand change in the cluster doesn't sit there as drift until
the next run; an agent undoes it within the next loop. That's safer
against snowflakes and harsher during an incident, when a hand fix is
sometimes exactly what you need.

## Where it gets tricky

**The state file holds secrets.** Values like database passwords can
end up in the state file, which is plain JSON. Don't
commit it to Git. Store it in a backend with access control and
locking, and keep the secrets themselves in [[secrets-management|a
secrets manager]] where you can. Don't edit it by hand either; use `terraform state` commands.

**Two runs at once corrupt things.** Without a lock, two engineers
applying at the same time can both write state. A remote backend with
locking stops the second run. `-lock=false` turns the lock off,
which is dangerous if anyone else might run at the same time.

**At scale, the cache becomes the truth.** Because refreshing
everything is slow, big teams run with `-refresh=false` or narrow a
run with `-target`. Then the plan is built on the cached state, which
can be wrong, and the plan can come out incomplete or incorrect. One
way out is smaller, separate state files, so each refresh covers
fewer resources.

**Refresh without looking.** The old `terraform refresh` command
overwrote the state file straight away, without showing you what had
changed. Since Terraform 0.15.4 the preferred way is `-refresh-only`
on `plan` or `apply`, which shows you the change first.

**Update or replace.** Some changes can be made in place; others
destroy the old resource and create a new one. For a database, that's
the difference between a config tweak and losing the data. Read every
plan for "replace" and "destroy" before you apply.

**Terraform vs OpenTofu.** HashiCorp moved Terraform from an
open-source licence to the Business Source License, and a group of
companies forked it as OpenTofu, now under the Linux Foundation.
OpenTofu reads Terraform state files up to Terraform 1.5.x and uses
the same providers through its own registry.

## What this means when you build

- Every piece of infrastructure goes in a file, in the repository,
  through review. If you must fix something by hand in an emergency,
  put it into the config straight after.
- Keep state in a locked, access-controlled remote backend.
- Read the plan made right before apply, and look hard at anything it
  wants to replace or destroy.
- Check for drift on a schedule; don't wait for the next change to
  find it.
- Keep each state small enough that a full refresh is quick.

## Further reading

- [InfrastructureAsCode](https://martinfowler.com/bliki/InfrastructureAsCode.html), Martin Fowler, 2016. The idea and its practices in one page, from Kief Morris's book.
- [State](https://developer.hashicorp.com/terraform/language/state), HashiCorp, Terraform docs (v1.16). What state records, where it lives, and why it doesn't belong in Git.
- [Purpose of Terraform State](https://developer.hashicorp.com/terraform/language/state/purpose), HashiCorp. Why a state file is needed at all, including the failed tags approach.
- [terraform plan command](https://developer.hashicorp.com/terraform/cli/commands/plan), HashiCorp, Terraform docs (v1.16). The three steps of a plan, saved vs speculative plans, and planning modes.
- [Manage resource drift](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift), HashiCorp. A hands-on drift example: a security group changed by hand, found and fixed.
- [OpenGitOps principles](https://opengitops.dev/), OpenGitOps, v1.0.0. The four principles of continuous reconciliation.
- [OpenTofu FAQ](https://opentofu.org/faq/), OpenTofu project, 1.12. Why the fork exists and how compatible it is.
