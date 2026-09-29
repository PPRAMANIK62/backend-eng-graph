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
- (For capacity-planning.) What capacity planning is for. "Demand forecasting and capacity planning can be viewed as ensuring that there is sufficient capacity and redundancy to serve projected future demand with the required availability." (Demand Forecasting and Capacity Planning)
- Two kinds of growth: organic (normal adoption) and inorganic (launches, marketing campaigns, business events). (Demand Forecasting and Capacity Planning)
- The forecast must reach past the lead time. "An accurate organic demand forecast, which extends beyond the lead time required for acquiring capacity" (Demand Forecasting and Capacity Planning)
- Load testing turns servers into service capacity. "Regular load testing of the system to correlate raw capacity(servers, disks, and so on) to service capacity" (Demand Forecasting and Capacity Planning)
- Adding capacity is riskier than shifting load, so treat it with care. "it is a riskier operation than load shifting" (Provisioning)
- Slower is less capacity. "A slowdown in a service equates to a loss of capacity." (Efficiency and Performance)
- Capacity is defined at a latency. "SREs provision to meet a capacity target at a specific response speed" (Efficiency and Performance)
- Why adding capacity is risky. "Adding new capacity often involves spinning up a new instance or location, making significant modification to existing systems (configuration files, load balancers, networking), and validating that the new capacity performs and delivers correct results." (Provisioning)

## Visuals worth redrawing

None.

## My notes

- Google-specific and from 2016; job titles elsewhere vary. Use it to
  describe what SRE is meant to be, not how every company staffs it.
