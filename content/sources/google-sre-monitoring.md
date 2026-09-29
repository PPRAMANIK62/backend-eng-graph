---
id: google-sre-monitoring
title: Monitoring Distributed Systems (Site Reliability Engineering, chapter 6)
author: Rob Ewaschuk; edited by Betsy Beyer (Google)
url: https://sre.google/sre-book/monitoring-distributed-systems/
kind: book
primary: true
---

## Summary

The Google SRE book chapter on monitoring. The part used here is "The
Four Golden Signals" (latency, traffic, errors, saturation) and the
section on worrying about the tail, which argues for latency histograms
over means.

## Key claims

- The four signals. "The four golden signals of monitoring are latency, traffic, errors, and saturation." (The Four Golden Signals)
- If you only get four metrics, these are the ones. "If you can only measure four metrics of your user-facing system, focus on these four." (The Four Golden Signals)
- Separate the latency of failed requests from successful ones; fast 500s pull the average down. "It’s important to distinguish between the latency of successful requests and the latency of failed requests." (Latency)
- A slow error is worse than a fast one, so track error latency too. "a slow error is even worse than a fast error!" (Latency)
- Errors include explicit failures, wrong content with a 200, and policy failures such as too slow. "The rate of requests that fail, either explicitly (e.g., HTTP 500s), implicitly (for example, an HTTP 200 success response, but coupled with the wrong content), or by policy" (Errors)
- Traffic is a system-specific demand measure, usually HTTP requests per second for a web service. "For a web service, this measurement is usually HTTP requests per second" (Traffic)
- Saturation: how full the service is, focusing on the most constrained resource. "How "full" your service is." (Saturation) [the word full is in quotes on the page]
- Systems degrade before 100%. "Note that many systems degrade in performance before they achieve 100% utilization, so having a utilization target is essential." (Saturation)
- Rising latency often warns of saturation. "Latency increases are often a leading indicator of saturation." (Saturation)
- Means hide the tail. "If you run a web service with an average latency of 100 ms at 1,000 requests per second, 1% of requests might easily take 5 seconds." (Worrying About Your Tail)
- Collect counts in latency buckets rather than raw latencies. "collect request counts bucketed by latencies (suitable for rendering a histogram), rather than actual latencies" (Worrying About Your Tail)
- Exponential bucket boundaries. "Distributing the histogram boundaries approximately exponentially (in this case by factors of roughly 3) is often an easy way to visualize the distribution of your requests." (Worrying About Your Tail)
- The fast-error example: a 500 from a lost database connection. "an HTTP 500 error triggered due to loss of connection to a database or other critical backend might be served very quickly" (Latency)
- Where each kind of error is seen. "catching HTTP 500s at your load balancer can do a decent job of catching all completely failed requests, while only end-to-end system tests can detect that you’re serving the wrong content." (Errors)
- Pages are expensive: they interrupt work, personal time and sleep, and too many get skimmed or ignored. "When pages occur too frequently, employees second-guess, skim, or even ignore incoming alerts" (Why Monitor?)
- Every page should be actionable. "Every page should be actionable." (Tying These Principles Together)
- A page that needs only a robotic response shouldn't be a page. "If a page merely merits a robotic response, it shouldn’t be a page." (Tying These Principles Together)
- You can only respond with urgency a few times a day. "I can only react with a sense of urgency a few times a day before I become fatigued." (Tying These Principles Together)
- Spend effort on symptoms more than causes. "it’s better to spend much more effort on catching symptoms than causes" (Tying These Principles Together)
- Rote pages are a warning sign. "Pages with rote, algorithmic responses should be a red flag." (Monitoring for the Long Term)

- Alerts come as tickets, email or pages. "A notification intended to be read by a human and that is pushed to a system such as a bug or ticket queue, an email alias, or a pager." (Definitions, Alert)
- Pages cost people, and too many get ignored. "When pages occur too frequently, employees second-guess, skim, or even ignore incoming alerts, sometimes even ignoring a "real" page that’s masked by the noise." (Why Monitor?)
- Good alerting in one line. "Effective alerting systems have good signal and very low noise." (Why Monitor?)
- Google avoids self-tuning "magic" alerting. "We avoid "magic" systems that try to learn thresholds or automatically detect causality." (Setting Reasonable Expectations)
- Rules that page should be simple. "Rules that generate alerts for humans should be simple to understand and represent a clear failure." (Setting Reasonable Expectations)
- Symptom is what's broken, cause is why. "The "what’s broken" indicates the symptom; the "why" indicates a (possibly intermediate) cause." (Symptoms Versus Causes)
- Table 6-1 example pair: symptom "I’m serving HTTP 500s or 404s", cause "Database servers are refusing connections". (Table 6-1)
- Table 6-1 other pairs: slow responses caused by overloaded CPUs or a crimped Ethernet cable showing as partial packet loss; a push that dropped ACLs made private content world-readable. (Table 6-1)
- One team's symptom is another's cause. "Note that in a multilayered system, one person’s symptom is another person’s cause." (Black-Box Versus White-Box)
- Black-box monitoring is good for paging, useless for what's coming. "On the other hand, for not-yet-occurring but imminent problems, black-box monitoring is fairly useless." (Black-Box Versus White-Box)
- The philosophy on pages. "Every page should be actionable." (Tying These Principles Together)
- Scripted responses mean it shouldn't be a page. "If a page merely merits a robotic response, it shouldn’t be a page." (Tying These Principles Together)
- Worry about causes only when definite and imminent. "it’s better to spend much more effort on catching symptoms than causes; when it comes to causes, only worry about very definite, very imminent causes." (Tying These Principles Together)
- Rarely exercised alerting config should be removed. "Data collection, aggregation, and alerting configuration that is rarely exercised (e.g., less than once a quarter for some SRE teams) should be up for removal." (As Simple as Possible)
- Rote pages are a red flag. "Pages with rote, algorithmic responses should be a red flag." (Gmail case study)
- Bigtable case: alerts on an SLO driven by a slow tail fired so much the team missed real user problems; they relaxed the SLO to the 75th percentile and turned off email alerts to get time to fix the causes. (Bigtable SRE: A Tale of Over-Alerting)
- Email alerts have little value. "Email alerts are of very limited value and tend to easily become overrun with noise" (Conclusion)
- Page load is reviewed with management as incidents per shift, quarterly. (The Long Run)
- Monitoring defined: collecting and showing real-time numbers about a system. "Collecting, processing, aggregating, and displaying real-time quantitative data about a system, such as query counts and types, error counts and types, processing times, and server lifetimes." (Definitions, Monitoring)
- White-box monitoring uses the system's internals, including logs. "Monitoring based on metrics exposed by the internals of the system, including logs, interfaces like the Java Virtual Machine Profiling Interface, or an HTTP handler that emits internal statistics." (Definitions, White-box monitoring)
- Black-box monitoring tests what a user sees. "Testing externally visible behavior as a user would see it." (Definitions, Black-box monitoring)
- One reason to monitor is ad hoc debugging after the fact. "Our latency just shot up; what else happened around the same time?" (Why Monitor?, Conducting ad hoc retrospective analysis)
- Monitoring should answer two questions. "Your monitoring system should address two questions: what’s broken, and why?" (Symptoms Versus Causes)
- Google uses much white-box monitoring and a little critical black-box. "We combine heavy use of white-box monitoring with modest but critical uses of black-box monitoring." (Black-Box Versus White-Box)
- White-box catches imminent problems and failures hidden by retries. "White-box monitoring therefore allows detection of imminent problems, failures masked by retries, and so forth." (Black-Box Versus White-Box)
- A page interrupts work, personal time and sleep. "If the employee is at home, a page interrupts their personal time, and perhaps even their sleep." (Why Monitor?)
- Prefer a dashboard of subcritical problems to email alerts. "instead, you should favor a dashboard that monitors all ongoing subcritical problems" (Conclusion)

## Visuals worth redrawing

None.

## My notes

- The 100 ms / 5 s line is an illustration ("might easily"), not a
  measurement.
