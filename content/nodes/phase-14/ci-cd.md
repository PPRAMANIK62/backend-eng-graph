---
id: ci-cd
title: CI/CD
depth: short
phase: 14
note: >-
  Build, test and deploy on every merge.
needs: []
leads_to: [deployment-strategies, feature-flags]
compare_with: []
---

# CI/CD

CI/CD is the habit of merging small changes into one main branch all
the time, and letting machines build, test and ship each one. It's why
a team can deploy many times a day without a release night. The letters
hide three different promises.

## Three promises, not one

Say you fix a bug in the order service and push the fix to `main`.

**Continuous integration** is about that push. Everyone on the team
merges into the main branch at least once a day, and every merge
triggers an automated build that runs the tests. If the build goes
red, fixing it comes first, usually by reverting the last commit to
get back to the last good build. Nobody's work drifts far from
anyone else's, so conflicts stay small.

**Continuous delivery** is about the build that comes out. The main
branch is kept releasable at all times: any green build could go to
production. Whether it actually goes is a business decision, made by a
person pressing a button.

**Continuous deployment** removes the button. Every build that passes
every automated check goes to production on its own. Google calls one
version of this "push on green". Amazon's pipelines work this way:
once a change is merged, no developer touches or watches it again
before it reaches customers.

## The pipeline

Tests that hit a real database or other services are slow, and a
build that takes an hour stops people from merging often. So the work
is split into stages that run one after another, a **deployment
pipeline**:

![A left-to-right pipeline. A merge to main triggers the commit stage (compile, unit tests with fakes, target about ten minutes). A green build becomes an artifact, built hermetically, versioned by hash and signed. The artifact moves through slower test stages (integration and end-to-end tests against real dependencies, possibly hours), then production, where a canary or one-box goes first and the deploy widens in stages. A red result at any stage stops the artifact; in production, an alarm rolls back to the last good artifact.](img/ci-cd-pipeline.svg)

*The stages a change passes through. Adapted from Martin Fowler, "Continuous Integration", and Clare Liguori, "Automating safe, hands-off deployments".*

- **Commit stage.** Compile and run unit tests with slow things
  replaced by fakes. The long-standing target is about ten minutes, so
  people get an answer before they've moved on.
- **Artifact.** The green build's output is what moves on to the
  later stages. Google builds are hermetic: the same source revision
  gives identical results on any machine, because the build depends
  only on known versions of its tools and libraries, not on whatever
  is installed. Amazon builds run with no network access for the same
  reason. Packages are versioned by hash and signed, so what runs in
  production can be traced to exactly one build (more in
  [[supply-chain-security]]).
- **Slower test stages.** Integration and end-to-end tests against
  real dependencies. These can take hours. When one of them catches a
  bug, the fix includes a fast test in the commit stage that would
  have caught it earlier.
- **Production.** Not all at once. The new build goes to a small slice
  first and widens in steps, which is what
  [[deployment-strategies]] covers. At Amazon, an alarm watching the
  new code rolls it back automatically; often the rollback is already
  running by the time the on-call engineer is paged.

Amazon runs separate pipelines for application code, infrastructure,
[[configuration]] and feature flags, all with the same safety steps,
because a bad config push can break production just as a bad code
push can. [[infrastructure-as-code|Infrastructure as code]] is what
lets infrastructure go through a pipeline at all.

## Keeping unfinished work on main

Merging daily means half-built features land on the main branch and
ship in releases. Three ways to keep them from doing anything:

- **Build the entry point last.** Write and test all the new code, and
  add the button or route that reaches it only when it's done.
- **[[feature-flags|Feature flags]].** The code ships switched off, and
  a flag turns it on later. The flag should be removed once the feature
  is fully out.
- **Branch by abstraction.** Put an interface in front of the thing
  you're replacing, and move callers from the old implementation to
  the new one behind it.

Database changes get the same treatment. The schema and data change
through a series of small migration scripts, kept in version control
next to the code that uses them, so any version of the software can be
built with the right schema. Live schema changes are
[[zero-downtime-migrations]].

## Where it gets tricky

**A CI server on feature branches isn't continuous integration.**
Plenty of teams run tests on every pull request and call it CI. If
branches live for a week, people still aren't seeing each other's code
until they merge, which is exactly the problem CI exists to solve.

**Green doesn't mean safe.** Test environments aren't production, and
some bugs only appear under real traffic, real data or real load.
That's why the pipeline doesn't end at the last test stage but in a
staged rollout watched by [[canary-analysis]].

**Config changes need a pipeline too.** It's easy to build a careful
pipeline for code and still change config by hand in production. At
Google, most incidents are triggered by binary or config pushes, so a
config push deserves the same stages as a code push.

## What this means when you build

- Merge small changes into main at least daily. Keep the commit build
  near ten minutes.
- Build the artifact once, pin its inputs, and promote that same
  artifact through every stage.
- Put the build id in every running process (a flag, a log line, an
  endpoint), so you always know what's deployed.
- Automate rollback before you automate deploying more often.
- Send config, infrastructure and flag changes through a pipeline too.

## Further reading

- [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html), Martin Fowler, 2024. The practices, the deployment pipeline, hiding work in progress, and CI vs delivery vs deployment.
- [Release Engineering](https://sre.google/sre-book/release-engineering/), Dinah McNutt, *Site Reliability Engineering*, Google, 2016. Hermetic builds, release branches, signed packages and push on green at Google.
- [Automating safe, hands-off deployments](https://builder.aws.com/content/3ErTKQOTKc5NIw031UePBPxTQ6I/automating-safe-hands-off-deployments), Clare Liguori, Amazon Builders' Library. What a full pipeline looks like when nobody watches it, from merge to automatic rollback.
- [Canarying Releases](https://sre.google/workbook/canarying-releases/), Alec Warner and Štěpán Davidovič, *The Site Reliability Workbook*, Google, 2018. The release engineering principles, and the finding that most of Google's incidents follow a binary or config push.
