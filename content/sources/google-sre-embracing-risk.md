---
id: google-sre-embracing-risk
title: Embracing Risk (Site Reliability Engineering, chapter 3)
author: Marc Alvidrez; error budget section by Mark Roth (Google)
url: https://sre.google/sre-book/embracing-risk/
kind: book
primary: true
---

## Summary

Chapter 3 of Google's SRE book (2016), free online. Why 100% is the
wrong reliability target, the two ways to compute availability (time
based and request based), how to pick a target for a service, and the
motivation and mechanics of error budgets.

## Key claims

- Past a point, more reliability makes a service worse, because it slows features and costs more. "past a certain point, however, increasing reliability is worse for a service (and its users) rather than better!" (opening)
- Users can't see the difference because the rest of the path is less reliable. "a user on a 99% reliable smartphone cannot tell the difference between 99.99% and 99.999% service reliability!" (opening)
- Each step up in reliability can cost far more than the last. "an incremental improvement in reliability may cost 100x more than the previous increment." (Managing Risk)
- The target is both a floor and a ceiling. "In a sense, we view the availability target as both a minimum and a maximum." (Managing Risk)
- Exceeding the target by much wastes chances to add features, pay down debt or cut cost. "when we set an availability target of 99.99%,we want to exceed it, but not by much: that would waste opportunities to add features to the system, clean up technical debt, or reduce its operational costs." (Managing Risk)
- Availability is expressed in nines; each nine is ten times closer to 100%. "Each additional nine corresponds to an order of magnitude improvement toward 100% availability." (Measuring Service Risk)
- Time-based availability: 99.99% allows 52.56 minutes down per year. "a system with an availability target of 99.99% can be down for up to 52.56 minutes in a year and stay within its availability target" (Time-based availability)
- For a globally distributed service, time-based availability says little, because some part is nearly always up. "At Google, however, a time-based metric for availability is usually not meaningful because we are looking across globally distributed services." (Time-based availability)
- So availability is the request success rate instead. "we define availability in terms of the request success rate." (Time-based availability)
- Example: 2.5M requests a day at 99.99% allows 250 errors. "a system that serves 2.5M requests in a day with a daily availability target of 99.99% can serve up to 250 errors and still hit its target for that given day." (Aggregate availability)
- Not all requests are equal, but the success rate is a fair approximation of what users see. "not all requests are equal: failing a new user sign-up request is different from failing a request polling for new email in the background." (Aggregate availability)
- Request success rate approximates downtime as users see it. "availability calculated as the request success rate over all requests is a reasonable approximation of unplanned downtime, as viewed from the end-user perspective." (Aggregate availability)
- The same idea works for batch and pipeline systems that count good and bad units of work. "Most nonserving systems (e.g., batch, pipeline, storage, and transactional systems) have a well-defined notion of successful and unsuccessful units of work." (Aggregate availability)
- Targets are usually quarterly and tracked weekly or daily. "Most often, we set quarterly availability targets for a service and track our performance against those targets on a weekly, or even daily, basis." (Aggregate availability)
- Same number of errors, different harm: a steady trickle vs a full outage. "Both types of failure may result in the same absolute number of errors, but may have vastly different impacts on the business." (Types of failures)
- Cost example: going from 99.9% to 99.99% on $1M revenue is worth $900. "Value of improved availability: $1M * 0.0009 = $900" (Cost)
- Typical ISP background error rate measured between 0.01% and 1%. "we’ve measured the typical background error rate for ISPs as falling between 0.01% and 1%." (Cost)
- Error budget comes from the SLO and says how unreliable the service may be in a quarter. "The error budget provides a clear, objective metric that determines how unreliable the service is allowed to be within a single quarter." (Forming Your Error Budget)
- Uptime is measured by the monitoring system, a neutral party. "The actual uptime is measured by a neutral third party: our monitoring system." (Forming Your Error Budget)
- Releases go out while budget remains. "as long as there is error budget remaining—new releases can be pushed." (Forming Your Error Budget)
- Worked example: 99.999% SLO, a problem that fails 0.0002% of queries spends 20% of the budget. "If a problem causes us to fail 0.0002% of the expected queries for the quarter, the problem spends 20% of the service’s quarterly error budget." (Forming Your Error Budget)
- When the budget is spent, releases stop for a while. "releases are temporarily halted while additional resources are invested in system testing and development to make the system more resilient" (Benefits)
- Gentler options than on/off exist: slow down or roll back as the budget nears zero. "slowing down releases or rolling them back when the SLO-violation error budget is close to being used up." (Benefits)
- Developers police themselves once they see the budget. "In effect, the product development team becomes self-policing." (Benefits)
- It only works if someone can actually stop launches. "this outcome relies on an SRE team having the authority to actually stop launches if the SLO is broken." (Benefits)
- Outages you didn't cause (network, datacenter) spend the budget too. "What happens if a network outage or datacenter failure reduces the measured SLO? Such events also eat into the error budget." (Benefits)
- A team that can't ship can choose to loosen the SLO. "they may elect to loosen the SLO (thus increasing the error budget) in order to increase innovation." (Benefits)
- 100% is never the right target. "100% is probably never the right reliability target" (Key Insights)
- Developers are judged on velocity, SRE on reliability, so they pull opposite ways. "Product development performance is largely evaluated on product velocity, which creates an incentive to push new code as quickly as possible." (Motivation for Error Budgets)
- Without a shared metric, the balance comes down to negotiating skill. "one can rarely prove that this balance is optimal, rather than just a function of the negotiating skills of the engineers involved." (Motivation for Error Budgets)
- Near the end of the budget, developers slow themselves down. "When the budget is nearly drained, the product developers themselves will push for more testing or slower push velocity, as they don’t want to risk using up the budget and stall their launch." (Benefits)

## Visuals worth redrawing

- The two availability equations (time based: uptime / (uptime +
  downtime); aggregate: successful requests / total requests). They're
  images on the page; the alt text names them.

## My notes

- Written for Google-scale services. The request-success definition
  assumes you have many requests; a tiny service with few requests gets
  noisy numbers.
