---
id: google-sre-book-introduction
title: "Introduction (Site Reliability Engineering, ch. 1)"
author: Benjamin Treynor Sloss, edited by Betsy Beyer
url: https://sre.google/sre-book/introduction/
kind: book
primary: true
---

## Summary

The opening chapter of Google's SRE book, by the person who started SRE at
Google in 2003. Defines SRE as software engineers doing operations work,
contrasts it with the sysadmin model, sets the 50% cap on ops work, lists
what an SRE team is responsible for, and introduces error budgets.

## Key claims

- The definition. "SRE is what happens when you ask a software engineer to design an operations team." (Google's Approach to Service Management: Site Reliability Engineering)
- SRE teams hire software engineers to run products and automate work sysadmins would do by hand. "our Site Reliability Engineering teams focus on hiring software engineers to run our products and to create systems to accomplish the work that would otherwise be performed, often manually, by sysadmins." (Google's Approach to Service Management: Site Reliability Engineering)
- Ops work is capped at 50%. "Google places a 50% cap on the aggregate \"ops\" work for all SREs—tickets, on-call, manual tasks, etc." (same)
- Excess ops work goes back to the product developers, including putting developers on call. "redirecting excess operational work to the product development teams: reassigning bugs and tickets to development managers, [re]integrating developers into on-call pager rotations" (Ensuring a Durable Focus on Engineering)
- What an SRE team owns. "an SRE team is responsible for the availability, latency, performance, efficiency, change management, monitoring, emergency response, and capacity planning of their service(s)." (Tenets of SRE)
- DevOps emerged in late 2008 and shares many of SRE's principles. "The term “DevOps” emerged in industry in late 2008" (DevOps or SRE?)
- 100% is the wrong reliability target; the error budget is one minus the availability target. "100% is the wrong reliability target for basically everything" (Pursuing Maximum Change Velocity Without Violating a Service's SLO)

## Visuals worth redrawing

None.

## My notes

- Google-specific and from 2016; job titles elsewhere vary. Use it to
  describe what SRE is meant to be, not how every company staffs it.
