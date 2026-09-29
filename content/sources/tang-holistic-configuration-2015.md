---
id: tang-holistic-configuration-2015
title: Holistic Configuration Management at Facebook
author: Chunqiang Tang, Thawan Kooburat, Pradeep Venkatachalam, Akshay Chander, Zhe Wen, Aravind Narayanan, Patrick Dowell and Robert Karl (Facebook)
url: https://sigops.org/s/conferences/sosp/2015/current/2015-Monterey/printable/008-tang.pdf
kind: paper
primary: true
---

## Summary

SOSP 2015 paper on how Facebook manages runtime configuration that
changes live, many times a day, without a redeploy: Configerator
(config as code, validators, review, CI, automated canary, distribution
to hundreds of thousands of servers), Gatekeeper (feature rollouts) and
the incidents that shaped them.

## Key claims

- Config changes are live and frequent. "The site’s various configurations are changed even more frequently, currently thousands of times a day." (1 Introduction)
- Code ships twice a day, config thousands of times. "We roll facebook.com onto new code twice a day" (1 Introduction)
- Config errors are a major outage cause. "Configuration errors are a major source of site outages" (3.3)
- Small config mistakes can take the site down. "Even a minor mistake could potentially cause a site-wide outage." (Configuration authoring and version control)
- Config is treated like code and reviewed. "a config change is treated the same as a code change and goes though the same rigorous code review process." (Defending against configuration errors; "goes though" is the paper's typo)
- The canary tool rolls out in stages, watches health and rolls back on its own. "the automated canary testing tool rolls out a config change to production in a staged fashion" (Defending against configuration errors; the sentence goes on to say it monitors health and rolls back automatically)
- New code ships disabled, then Gatekeeper turns it on gradually and can turn it off fast. "we commonly release the new code into production early but in a disabled mode, and then use a tool called Gatekeeper to incrementally enable it online." (Gating new product features)
- Gatekeeper targets groups like employees or 1% of a device model. "It controls which users will experience the new feature, e.g., Facebook employees only or 1% of the users of a mobile device model." (Gating new product features)
- A canary spec has phases: 20 servers, then a full cluster. "For example, in phase 1, test on 20 servers; in phase 2, test in a full cluster with thousands of servers." (3.3)
- Pass/fail predicates compare new-config servers with old-config servers. "the click-through rate (CTR) collected from the servers using the new config should not be more than x% lower than the CTR collected from the servers still using the old config." (3.3)
- Old code couldn't read a new config schema; the canary caught it on 20 servers. "Typically, the new client code can read the old config schema, but the old client code cannot read the new config schema." (6.4)
- The canary compared error logs and aborted. "It compared the error logs of those 20 servers with those of the rest of the production servers, and detected a log spew, i.e., rapid growth of error logs." (6.4)
- An engineer overrode the canary thinking it was a false positive. "She overrode the tool’s rejection and deployed the config, which caused more crashes." (6.4)
- A small canary missed a load problem, so a cluster-sized phase was added. "Since then, we added a canary phase to test a new config on thousands of servers in a cluster in order to catch cluster-level load issues." (6.4)
- 16% of high-impact incidents in three months were config-related. "We found that 16% of the incidents were related to configuration management, while the rest were dominated by software bugs." (6.4)
- Breakdown of those: common config errors 42%, subtle config errors 36%, valid config changes exposing code bugs 22%. (6.4, table)
- Config reaches servers in about 14.5 seconds at baseline; the canary takes about ten minutes anyway. "The baseline latency is about 14.5 seconds, but it increases with the load." (6.3)
- Gatekeeper costs a lot of CPU. "currently Gatekeeper consumes a significant percentage of the total CPU of the frontend clusters" (6.3)
- Billions of Gatekeeper checks per second. "Because the check throughput is high (billions of checks per second)" (6.3)
- Facebook moved from optional to mandatory review and testing for config. "Facebook has evolved from optional diff review and optional manual testing for config changes, to mandatory diff review and mandatory manual testing." (7)
- Validators check invariants for each config type. "the configuration compiler automatically runs validators to verify invariants defined for configs." (Defending against configuration errors)
- The overridden change was valid but hit a race-condition bug on a new code path. "It turned out that the config change itself was indeed correct, but it caused the application to exercise a new code path and triggered a subtle race-condition bug in the code." (6.4)
- The canary rejection was for crashes. "rejected by the automated canary tool, because it caused some instances of the application to crash." (6.4)
- The load incident: mobile requests down a rare path overloaded a data store. "An engineer introduced a configuration error that sent mobile requests down a rare code path to fetch data from a backend store." (6.4)
- Small canaries didn't create the load. "the small scale testing was insufficient to cause any load issue." (6.4)
- Code and schema changes don't land together. "When both the client code and the config schema are updated together, they may not get deployed to a server at the same time." (6.4)
- Facebook judged Gatekeeper's CPU cost worthwhile. "we consider this "overhead" worthwhile, because it enables Facebook engineers to iterate rapidly on new product features." (6.3)

## Visuals worth redrawing

- Figure 3, the Configerator flow from edit to review, CI, canary,
  landing strip and distribution. Could be redrawn as a pipeline.

## My notes

- The paper is from 2015; Facebook's tools have surely changed since.
- Chef handles OS settings and software deployment; the paper is about
  runtime config only.
