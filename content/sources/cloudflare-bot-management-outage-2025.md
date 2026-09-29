---
id: cloudflare-bot-management-outage-2025
title: Cloudflare outage, the Bot Management feature file (postmortem)
author: Matthew Prince (Cloudflare)
url: https://blog.cloudflare.com/18-november-2025-outage/
kind: blog
primary: true
---

## Summary

Cloudflare's 2025 postmortem of its worst outage since 2019. A database
permissions change made a query return duplicate rows, so an
automatically generated config file (the Bot Management feature file)
doubled in size, spread to every machine in minutes, and crashed the
core proxy, which had a hard limit on the number of features. The page
title contains a calendar date, so the note title describes it instead.

## Key claims

- The trigger was a database permissions change, not an attack. "it was triggered by a change to one of our database systems' permissions which caused the database to output multiple entries into a “feature file” used by our Bot Management system." (intro)
- The bigger file went to every machine. "The larger-than-expected feature file was then propagated to all the machines that make up our network." (intro)
- The file is regenerated every five minutes, so good and bad versions alternated. "every five minutes there was a chance of either a good or a bad set of configuration files being generated and rapidly propagated across the network." (The outage)
- The fix was stopping propagation and restoring a known-good file. "We solved the problem by stopping the generation and propagation of the bad feature file and manually inserting a known good file into the feature file distribution queue." (The outage)
- The file is pushed often on purpose, to react to new bots. "So it’s critical that it is rolled out frequently and rapidly as bad actors change their tactics quickly." (How Cloudflare processes requests)
- The proxy preallocates memory for at most 200 features; about 60 were in use. "Currently that limit is set to 200, well above our current use of ~60 features." (Memory preallocation)
- Going past the limit panicked the Rust proxy. "thread fl2_worker_thread panicked: called Result::unwrap() on an Err value" (Memory preallocation)
- Follow-ups: validate internally generated config like user input, add kill switches. "Hardening ingestion of Cloudflare-generated configuration files in the same way we would for user-generated input" (Remediation and follow-up steps)
- "Enabling more global kill switches for features" (Remediation and follow-up steps)
- Bad files came only from database nodes that had already been updated. "Bad data was only generated if the query ran on a part of the cluster which had been updated." (The outage)
- The flapping made the team first suspect an attack. "Initially, this led us to believe this might be caused by an attack." (The outage)
- Worst outage since 2019. "Today was Cloudflare's worst outage since 2019." (Remediation and follow-up steps)
- Core traffic recovered at 14:30 UTC, all systems at 17:06; impact started 11:28. (timeline)
- The file is built by a query every five minutes. "the file was being generated every five minutes by a query running on a ClickHouse database cluster" (The outage)
- The file doubled in size. "That feature file, in turn, doubled in size." (intro)

## Visuals worth redrawing

- The 5xx chart that flaps up and down before staying high. A schematic
  would show the alternating good/bad file well.

## My notes

- The old proxy (FL) didn't error; it gave every request a bot score of
  zero instead. Same bad input, two failure modes.
