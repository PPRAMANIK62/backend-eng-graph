---
id: twelve-factor-config
title: "The Twelve-Factor App, III. Config"
author: Adam Wiggins
url: https://12factor.net/config
kind: blog
primary: true
---

## Summary

The config factor of the Twelve-Factor App (last updated 2017): config
is whatever changes between deploys, it must be strictly separate from
code, and it lives in environment variables set per deploy.

## Key claims

- Config is what varies between deploys. "An app’s config is everything that is likely to vary between deploys (staging, production, developer environments, etc)." (first paragraph)
- Strict separation of config from code. "Config varies substantially across deploys, code does not." (second paragraph)
- The open-source litmus test. "A litmus test for whether an app has all config correctly factored out of the code is whether the codebase could be made open source at any moment, without compromising any credentials." (litmus test)
- Internal wiring isn't config. "This type of config does not vary between deploys, and so is best done in the code." (routes and Spring example)
- Store config in environment variables. "The twelve-factor app stores config in environment variables (often shortened to env vars or env)." (env vars)
- Named environment groups explode. "resulting in a combinatorial explosion of config which makes managing deploys of the app very brittle." (grouping)

## Visuals worth redrawing

None.

## My notes

- Written for Heroku-style apps; says nothing about validating config or
  rolling out a config change carefully.
