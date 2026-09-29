---
id: google-sre-release-engineering
title: "Site Reliability Engineering, chapter 8: Release Engineering"
author: Dinah McNutt, edited by Betsy Beyer and Tim Harvey, Google
url: https://sre.google/sre-book/release-engineering/
kind: book
primary: true
---

## Summary

How Google builds and ships software (SRE book, 2016): hermetic builds,
release branches with cherry picks, continuous testing, signed packages
with labels, the Rapid release system and Sisyphus rollouts, and four
ways to ship configuration.

## Key claims

- Releases must be reproducible and automated, not one-offs. "releases are repeatable and aren’t “unique snowflakes.”" (introduction)
- Frequent releases mean fewer changes per version. "We have embraced the philosophy that frequent releases result in fewer changes between versions." (High Velocity)
- Push on Green: deploy every build that passes. "Other teams have adopted a “Push on Green” release model and deploy every build that passes all tests" (High Velocity)
- Hermetic builds give identical output for the same revision. "Our builds are hermetic, meaning that they are insensitive to the libraries and other software installed on the build machine." (Hermetic Builds)
- Every mainline change runs the unit tests. "A continuous test system runs unit tests against the code in the mainline each time a change is submitted, allowing us to detect build and test failures quickly." (Testing)
- Tests are re-run on the release branch because cherry picks create code that exists nowhere else. "We want to guarantee that the tests pass in the context of what’s actually being released." (Testing)
- Packages are versioned by hash and signed. "Packages are named (e.g., search/shakespeare/frontend), versioned with a unique hash, and signed to ensure authenticity." (Packaging)
- Rollouts are sized to the service's risk. "Our goal is to fit the deployment process to the risk profile of a given service." (Deployment)
- Big services start in one cluster and grow exponentially. "For large user-facing services, we may push by starting in one cluster and expand exponentially until all clusters are updated." (Deployment)
- Config changes are risky too. "configuration changes are a potential source of instability" (Configuration Management)
- All schemes keep config in the source repository with code review. "All schemes involve storing configuration in our primary source code repository and enforcing a strict code review requirement." (Configuration Management)
- Config at the head of mainline drifts from what's running. "this technique often leads to skew between the checked-in version of the configuration files and the running version of the configuration file because jobs must be updated in order to pick up the changes." (Configuration Management)
- Separate config packages let config change without a new binary. "This approach has the advantage of not requiring a new binary build." (Configuration Management)
- Config that changes while the binary runs lives in an external store. "These files can be stored in Chubby, Bigtable, or our source-based filesystem" (Configuration Management)
- Same revision, identical results on any machine. "If two people attempt to build the same product at the same revision number in the source code repository on different machines, we expect identical results." (Hermetic Builds)
- Builds depend on known tool and library versions. "Instead, builds depend on known versions of build tools, such as compilers, and dependencies, such as libraries." (Hermetic Builds)

## Visuals worth redrawing

- Figure 8-1, the Rapid architecture. Not needed.

## My notes

- Rapid, Blaze, MPM and Sisyphus are Google-internal names; Blaze is
  public as Bazel (footnote in the chapter).
