---
id: ewaschuk-philosophy-on-alerting
title: My Philosophy on Alerting
author: Rob Ewaschuk
url: https://docs.google.com/document/d/199PqyG3UsyXlwieHaqbGiWVa8eMWi8zzAn0YfcApr8Q/edit
kind: blog
primary: true
---

## Summary

A short essay by a Google SRE on which conditions should page a human.
Its core: page on symptoms users feel, not on causes; every page must be
urgent, actionable and need thought; send the not-yet-urgent things to a
tracked ticket queue instead of email. It became the basis of the SRE
book's monitoring chapter, and the Prometheus docs point to it.

## Key claims

- The essay is the basis of the SRE book chapter. "The ideas in this paper form the foundation for" (header, followed by the chapter title)
- Pages have four properties. "Pages should be urgent, important, actionable, and real." (Summary)
- Over-monitoring is the harder problem. "Err on the side of removing noisy alerts – over-monitoring is a harder problem to solve than under-monitoring." (Summary)
- Symptoms catch more problems with less effort. "Symptoms are a better way to capture more problems more comprehensively and robustly with less effort." (Summary)
- Cause information belongs in pages or dashboards, not in its own alerts. "Include cause-based information in symptom-based pages or on dashboards, but avoid alerting directly on causes." (Summary)
- Page responses shouldn't be scripted. "Every page should require intelligence to deal with: no robotic, scriptable responses." (Introduction)
- Users don't care about your database servers, they care about failing queries. "Do your users care if your MySQL servers are down?  No, they care if their queries are failing." (Monitor for your users)
- What users care about: availability and correctness, latency, completeness/freshness/durability of data, features. (Monitor for your users, list)
- Why cause alerts are bad: you have to catch the symptom anyway. "You're going to have to catch the symptom anyway." (Cause-based alerts are bad)
- Cause plus symptom alerts are redundant. "Once you catch the symptom and the cause, you have redundant alerts; these need separate tuning, and result in either duplication or complicated dependency trees" (Cause-based alerts are bad)
- The cause doesn't always lead to the symptom: the database may be down because an instance is being turned up or down, or because fast failover makes one server's availability irrelevant. "The allegedly inevitable result is not always inevitable" (Cause-based alerts are bad)
- The symptom can come from many causes. "Maybe it can happen because of network disconnection, or CPU contention, or myriad other problems you haven't thought of yet." (Cause-based alerts are bad)
- Cause alerts are sometimes needed, when there's no symptom until the cliff. "There's (often) no symptoms to "almost" running out of quota or memory or disk I/O, etc., so you want rules to know you're walking towards a cliff." (Cause-based alerts are bad)
- The best alerts come from the client's view. "The best alerts in a layered client/server system come from the client's perspective" (Alerting from the spout)
- In practice that often means the front load balancers. "For many services, this means alerting on what your front-most load-balancers see in terms of latency, errors, etc." (Alerting from the spout)
- Browser-side signals are noisy. "But remember that signal is full of noise—their ISP, browser, client-side load and performance—so it probably shouldn't be the only way you see the world." (Alerting from the spout)
- Put a terse list of firing cause rules in every page (his example lists an "Also firing:" section with rules like UserDatabaseShardDown under a 5xx page). "Print a terse summary of all of your cause-based rules that are firing in every page that you send out." (Causes are still useful)
- Sub-critical alerts go to a tracked ticket system with accountability. "Every alert should be tracked through a workflow system." (Tickets, Reports and Email)
- A long flow chart in a playbook means time spent documenting instead of fixing. "In general, if your playbook has a long detailed flow chart, you're potentially spending too much time documenting what could be wrong and too little time fixing it" (Playbooks)
- Playbooks should be short. "The best playbooks I've seen have a few notes about exactly what the alert means, and what's currently interesting about an alert" (Playbooks)
- Accuracy threshold. "Alerts that are less than 50% accurate are broken; even those that are false positives 10% of the time merit more consideration." (Tracking & Accountability)
- A known cause below the noise of the symptom can justify a cause alert, e.g. 0.001% failures in a 99.99% service. (You're being naïve!)
- For running out of quota, pair a late page (usage > 80%, out in < 4h) with an earlier ticket-level rule (quota > 90%, out in < 4d at last day's growth). (You're being naïve!)
- Someone must triage sub-critical alerts, daily or each shift. "make sure the oncall person (or someone else) is designated to triage these every day (or every shift hand-off, or whatever works)." (Tickets, Reports and Email)
- The client sees retries and network latency. "The client sees the results of retries, network latency between client & server, and has a better perspective on the user-facing latency and errors than the server" (Alerting from the spout)
- The load balancer sees failures the servers can't. "if they're all down, or serving out uncounted 500s, or dropping 10% of connections on the floor, your load balancer knows but your server might not." (Alerting from the spout)

## Visuals worth redrawing

None.

## My notes

- No year on the document; it points to a Hacker News discussion from
  2014, so it's at least that old.
