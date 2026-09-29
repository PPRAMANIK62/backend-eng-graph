---
id: google-sre-workbook-alerting-on-slos
title: Alerting on SLOs (The Site Reliability Workbook, chapter 5)
author: Steven Thurgood (Google)
url: https://sre.google/workbook/alerting-on-slos/
kind: book
primary: true
---

## Summary

Chapter 5 of Google's SRE Workbook (2018). How to turn an SLO into
pages and tickets. Walks through six alerting strategies, ending with
multiwindow, multi-burn-rate alerts. Only the burn-rate sections were
read closely for this note.

## Key claims

- Burn rate is how fast the budget is being spent, relative to the SLO. "Burn rate is how fast, relative to the SLO, the service consumes the error budget." (4: Alert on Burn Rate)
- Burn rate 1 spends exactly the whole budget by the end of the window. "a burn rate of 1, which means that it’s consuming error budget at a rate that leaves you with exactly 0 budget at the end of the SLO’s time window" (4: Alert on Burn Rate)
- At 99.9% over 30 days, a steady 0.1% error rate is burn rate 1. "With an SLO of 99.9% over a time window of 30 days, a constant 0.1% error rate uses exactly all of the error budget: a burn rate of 1." (4: Alert on Burn Rate)
- Table 5-4 for a 99.9% SLO: burn rate 2 (0.2% errors) empties it in 15 days, 10 (1%) in 3 days, 1,000 (100%) in 43 minutes. (Table 5-4)
- Recommended starting points: page on 2% of budget in 1 hour or 5% in 6 hours, ticket on 10% in 3 days. "We recommend 2% budget consumption in one hour and 5% budget consumption in six hours as reasonable starting numbers for paging, and 10% budget consumption in three days as a good baseline for ticket alerts." (5: Multiple Burn Rate Alerts)
- Those correspond to burn rates 14.4, 6 and 1. (Table 5-6)
- The goal is to be notified of events that eat a large part of the budget. "Your goal is to be notified for a significant event: an event that consumes a large fraction of the error budget." (Alerting Considerations)
- Four attributes to judge an alerting strategy: precision, recall, detection time, reset time. "How long alerts fire after an issue is resolved. Long reset times can lead to confusion or to issues being ignored." (Alerting Considerations, reset time)
- Strategy 1, error rate over 10 minutes >= SLO: total outage detected in 0.6 seconds, but low precision; 0.1% errors for 10 minutes uses only 0.02% of the monthly budget. (Table 5-1)
- Strategy 1 can page constantly while the SLO is met. "you could receive up to 144 alerts per day every day, not act upon any alerts, and still meet the SLO." (Table 5-1)
- Strategy 2, a 36-hour window (5% of budget): 2 minutes 10 seconds to detect a full outage, but it keeps firing for 36 hours. "Very poor reset time: In the case of 100% outage, an alert will fire shortly after 2 minutes, and continue to fire for the next 36 hours." (Table 5-2)
- Strategy 3, a duration clause: a 100% outage alerts after an hour, same as a 0.2% outage, having used 140% of the budget. "Because the duration does not scale with the severity of the incident, a 100% outage alerts after one hour, the same detection time as a 0.2% outage." (Table 5-3)
- A fluctuating SLI may never trip a duration clause. "An SLI that fluctuates between missing SLO and passing SLO may never alert." (Table 5-3)
- The chapter recommends against durations for SLO alerts. "we do not recommend using durations as part of your SLO-based alerting criteria." (3: Incrementing Alert Duration)
- Footnote: durations can still help against very short noise. "Duration clauses can occasionally be useful when you are filtering out ephemeral noise over very short durations." (footnote 1)
- Figure 5-3 example: 100% error spikes for 5 minutes every 10 minutes never fire a 10-minute-duration alert yet use 35% of the budget. "Each spike consumed almost 12% of the 30-day budget, yet the alert never triggered." (3: Incrementing Alert Duration)
- Strategy 4: 5% of a 30-day budget in one hour needs burn rate 36. "Five percent of a 30-day error budget spend over one hour requires a burn rate of 36." (4: Alert on Burn Rate)
- Its weak spot. "Low recall: A 35x burn rate never alerts, but consumes all of the 30-day error budget in 20.5 hours." (Table 5-5)
- Its reset time is 58 minutes. "Reset time: 58 minutes is still too long." (Table 5-5)
- Page vs ticket by how fast the budget will run out. "If an issue will exhaust the error budget within hours or a few days, sending an active notification is appropriate." (5: Multiple Burn Rate Alerts)
- Multiple burn rates need suppression so one incident doesn't send three notifications. (5: Multiple Burn Rate Alerts, last paragraph)
- Strategy 6 adds a short window; rule of thumb 1/12 of the long one. "A good guideline is to make the short window 1/12 the duration of the long window" (6: Multiwindow, Multi-Burn-Rate Alerts)
- Figure 5-6 walk-through: 15% errors for 10 minutes; short window crosses at once, long window after 5 minutes, alert fires then; short window drops below 5 minutes after the errors stop, which ends the alert; the long window alone would stay above for 60 minutes after. "The short window average drops below the threshold 5 minutes after the errors stop, at which point the alert stops firing." (6: Multiwindow, Multi-Burn-Rate Alerts)
- Table 5-8 for a 99.9% SLO: page on 1 h long / 5 min short / burn 14.4 / 2% of budget; page on 6 h / 30 min / 6 / 5%; ticket on 3 days / 6 h / 1 / 10%. (Table 5-8)
- The recommended approach overall. "In most cases, we believe that the multiwindow, multi-burn-rate alerting technique is the most appropriate approach to defending your application’s SLOs." (Conclusion)
- Low traffic: at 10 requests an hour, one failure is a 10% hourly error rate, a 1,000x burn rate, and 13.9% of the 30-day budget; only seven failures allowed in 30 days. "For a 99.9% SLO, this request constitutes a 1,000x burn rate and would page immediately, as it consumed 13.9% of the 30-day error budget." (Low-Traffic Services)
- Remedies for low traffic: artificial traffic, combining services, client retries with backoff and fallbacks, or a lower SLO / longer window. (Low-Traffic Services, list)
- Synthetic traffic can hide real users' errors. "if an issue affects real users but doesn’t affect artificial traffic, the successful artificial requests hide the real user signal" (Generating Artificial Traffic)
- A 90% target: a full outage uses only 1.4% of budget in an hour, so the 2%-in-an-hour page can never fire. (Extreme Availability Goals)
- A 99.999% monthly target: a full outage empties the budget in 26 seconds. "A 100% outage for a service with a target monthly availability of 99.999% would exhaust its budget in 26 seconds" (Extreme Availability Goals)
- At scale, don't tune windows and burn rates per service. "Once you decide on your alerting parameters, apply them to all your services." (Alerting at Scale)
- Group request types into a few buckets (CRITICAL, HIGH_FAST, HIGH_SLOW, LOW, NO_SLO) with shared targets. (Alerting at Scale, Table 5-10)
- Error budgets and error rates apply to every SLI written as good events over total events. "The error budget gives the number of allowed bad events, and the error rate is the ratio of bad events to total events." (Ways to Alert on Significant Events)
- The windowed error ratio is computed from two counters (slo_errors, slo_requests) with a Prometheus recording rule. "This 10-minute average is calculated in Prometheus with a Recording rule" (1: Target Error Rate, note)
- Pages and tickets are the only valid ways to get a human to act. "pages and tickets are the only valid ways to get a human to take action." (footnote 2)
- Slow burns become tickets for the next working day. "Otherwise, a ticket-based notification to address the alert the next working day is more appropriate." (5: Multiple Burn Rate Alerts)
- 26 seconds is shorter than many metric collection intervals. "which is smaller than the metric collection interval of many monitoring services" (Extreme Availability Goals)
- The only defence at 99.999% is a design that limits the blast radius, such as a 1% rollout. "The only way to defend this level of reliability is to design the system so that the chance of a 100% outage is extremely low." (Extreme Availability Goals)
- Per-service tuning becomes toil. "this scenario very quickly accumulates toil and cognitive load that does not scale." (Alerting at Scale)

## Visuals worth redrawing

- Figure 5-4: budget remaining over a 30-day window for several burn
  rates, each a straight line hitting zero at a different time.

## My notes

- This is the main source for the phase 14 `alerting` node; error
  budgets only needs the definition of burn rate.
