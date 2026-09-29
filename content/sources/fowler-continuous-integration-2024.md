---
id: fowler-continuous-integration-2024
title: Continuous Integration
author: Martin Fowler
url: https://martinfowler.com/articles/continuousIntegration.html
kind: blog
primary: true
---

## Summary

Fowler's long article on continuous integration, rewritten in 2024 (the
first version is from 2000). What CI is, the practices that make it
work, the deployment pipeline, how to hide unfinished work on mainline,
and how CI, continuous delivery and continuous deployment differ.

## Key claims

- CI means everyone merges into mainline at least daily, and each merge is checked by an automated build with tests. "each member of a team merges their changes into a codebase together with their colleagues changes at least daily" (opening summary)
- The build must run its own tests. "Each of these integrations is verified by an automated build (including test) to detect integration errors as quickly as possible." (opening summary)
- A broken mainline build is fixed right away, usually by reverting. "Usually the best way to fix the build is to revert the latest commit from the mainline, taking the system back to the last-known good build." (Fix Broken Builds Immediately)
- Some teams gate commits so a red build never reaches mainline. "Some teams prefer to remove all risk of breaking the mainline by using a Pending Head (also called Pre-tested, Delayed, or Gated Commit.)" (Fix Broken Builds Immediately)
- Ten minutes is the target for the commit build. "For most projects, however, the XP guideline of a ten minute build is perfectly within reason." (Keep the Build Fast)
- A deployment pipeline runs several builds in sequence, fast one first. "The idea behind a deployment pipeline (also known as build pipeline or staged build) is that there are in fact multiple builds done in sequence." (Keep the Build Fast)
- The second stage can take hours. "This suite might take a couple of hours to run." (Keep the Build Fast, two-stage pipeline)
- A bug found late should become a test in the commit build. "As much as possible we want to ensure that any later-stage failure leads to new tests in the commit build that would have caught the bug" (Keep the Build Fast)
- Unfinished code on mainline is hidden with keystone interfaces, feature flags or branch by abstraction. "Keystones cover most cases of latent code, but for occasions where that's not possible we use Feature Flags." (Hide Work-in-Progress)
- Remove flags once the feature is out. "We then make sure we remove this logic promptly once a feature is fully released, so that the flags don't clutter the code base." (Hide Work-in-Progress)
- Deploying automatically makes automated rollback cheap. "If we deploy into production automatically, one extra capability we find handy is automated rollback." (Automate Deployment)
- Make the running version visible. "An about screen should contain a build id that ties back to version control" (Automate Deployment)
- A CI server on feature branches isn't CI. "The simple answer is “yes - but you're not doing Continuous Integration”." (Common Questions, feature branches)
- Continuous delivery keeps the product always releasable. "The aim of Continuous Delivery is that the product should always be in a state where we can release the latest build." (Common Questions)
- Continuous deployment releases every build that passes the pipeline. "Continuous Deployment means the product is automatically released to production whenever it passes all the automated tests in the deployment pipeline." (Common Questions)
- Databases change through small migration scripts kept with the code. "The key to this methodology is to define database schema and data through a series of migration scripts, that alter both the database schema and data." (How do we handle databases?)
- Migrations in version control let you build any version with the right schema. "We can store these migrations in version-control in sync with the data access code in the application, allowing us to build any version of the software, with the correct schema and correctly structured data." (How do we handle databases?)
- The commit stage uses test doubles for slow services. "run tests that are more localized unit tests with slow services replaced by Test Doubles , such as a fake in-memory database or a stub for an external service." (Keep the Build Fast)

## Visuals worth redrawing

- The two-stage deployment pipeline (commit build, then slower
  secondary build). Redraw as stages from commit to production.

## My notes

- Fowler treats trunk-based development as a synonym for CI.
