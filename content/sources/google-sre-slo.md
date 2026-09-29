---
id: google-sre-slo
title: Service Level Objectives (Site Reliability Engineering, chapter 4)
author: Chris Jones, John Wilkes, Niall Murphy, with Cody Smith; edited by Betsy Beyer (Google)
url: https://sre.google/sre-book/service-level-objectives/
kind: book
primary: true
---

## Summary

Chapter 4 of Google's SRE book (2016), free online. Defines SLIs, SLOs
and SLAs. Its section on aggregation explains why latency should be
read as a distribution and summarized with percentiles, not the mean,
with a figure of 50th to 99th percentile latency over a day.

## Key claims

- Latency, error rate and throughput are the common SLIs, aggregated into a rate, average or percentile. "The measurements are often aggregated: i.e., raw data is collected over a measurement window and then turned into a rate, average, or percentile." (Indicators)
- Averages over a window hide bursts: 200 req/s in even seconds and 0 in odd has the same average as a steady 100. "Consider a system that serves 200 requests/s in even-numbered seconds, and 0 in the others." (Aggregation)
- Averaging latency hides a slow tail. "it’s entirely possible for most of the requests to be fast, but for a long tail of requests to be much, much slower." (Aggregation)
- Think in distributions. "Most metrics are better thought of as distributions rather than averages." (Aggregation)
- Figure 4-1: typical request about 50 ms, but 5% of requests 20 times slower, and the average shows no change. "although a typical request is served in about 50 ms, 5% of requests are 20 times slower!" (Aggregation, Figure 4-1)
- In that figure, the average shows nothing while the tail changes over the day. "Monitoring and alerting based only on the average latency would show no change in behavior over the course of the day, when there are in fact significant changes in the tail latency (the topmost line)." (Aggregation, Figure 4-1)
- High percentiles show a plausible worst case, the median the typical case. "a high-order percentile, such as the 99th or 99.9th, shows you a plausible worst-case value, while using the 50th percentile (also known as the median) emphasizes the typical case." (Aggregation)
- Variance hurts users, worse under load because of queueing. "The higher the variance in response times, the more the typical user experience is affected by long-tail behavior, an effect exacerbated at high load by queuing effects." (Aggregation)
- Users prefer slightly slower but steadier. "User studies have shown that people typically prefer a slightly slower system to one with high variance in response time" (Aggregation)
- Prefer percentiles to the mean. "We generally prefer to work with percentiles rather than the mean (arithmetic average) of a set of values." (Aggregation)
- Latency data is skewed: nothing below 0 ms, timeouts cap the top, so mean and median can differ a lot. "As a result, we cannot assume that the mean and the median are the same—or even close to each other!" (Aggregation)
- Don't assume a normal distribution. "We try not to assume that our data is normally distributed without verifying it first" (Aggregation)
- Example SLO wording with a percentile and window. "99% (averaged over 1 minute) of Get RPC calls will complete in less than 100 ms (measured across all the backend servers)." (Standardize Indicators)
- (For sli-slo-sla.) SLA is an overloaded word, so the chapter separates three terms. "in common use, the term SLA is overloaded and has taken on a number of meanings depending on context." (Service Level Terminology)
- SLI definition. "An SLI is a service level indicator—a carefully defined quantitative measure of some aspect of the level of service that is provided." (Indicators)
- Sometimes only a proxy can be measured: client-side latency matters more, but only server latency may be available. "client-side latency is often the more user-relevant metric, but it might only be possible to measure latency at the server." (Indicators)
- Availability as an SLI is the fraction of well-formed requests that succeed, called yield. "It is often defined in terms of the fraction of well-formed requests that succeed, sometimes called yield." (Indicators)
- Nines naming, and Compute Engine's published target of 99.95%. "the current published target for Google Compute Engine availability is “three and a half nines”—99.95% availability." (Indicators)
- SLO definition and its shape. "A natural structure for SLOs is thus SLI ≤ target, or lower bound ≤ SLI ≤ upper bound." (Objectives)
- You can't set an SLO on something users decide, like incoming QPS. "the queries per second (QPS) metric is essentially determined by the desires of your users, and you can’t really set an SLO for that." (Objectives)
- Without a published SLO, users form their own beliefs, leading to over- or under-reliance. "Without an explicit SLO, users often develop their own beliefs about desired performance" (Objectives)
- Chubby was so reliable that services depended on it never failing, so SRE takes it down on purpose if it's above target. "if a true failure has not dropped availability below the target, a controlled outage will be synthesized by intentionally taking down the system." (The Global Chubby Planned Outage)
- SLA definition: a contract with consequences. "SLAs are service level agreements: an explicit or implicit contract with your users that includes consequences of meeting (or missing) the SLOs they contain." (Agreements)
- The test for SLO vs SLA. "if there is no explicit consequence, then you are almost certainly looking at an SLO." (Agreements)
- Google Search has no public SLA but still has SLOs. "Whether or not a particular service has an SLA, it’s valuable to define SLIs and SLOs and use them to manage the service." (Agreements)
- Most people say SLA when they mean SLO; a real SLA violation is a legal matter. "A real SLA violation might trigger a court case for breach of contract." (footnote 16)
- Common SLIs by system type: serving systems care about availability, latency, throughput; storage about latency, availability, durability; pipelines about throughput and end-to-end latency. "User-facing serving systems, such as the Shakespeare search frontends, generally care about availability, latency, and throughput." (What Do You and Your Users Care About?)
- Client-side measurement catches problems server metrics miss. "not measuring behavior at the client can miss a range of problems that affect users but don’t affect server-side metrics." (Collecting Indicators)
- Start from what users care about, not what's easy to measure. "Start by thinking about (or finding out!) what your users care about, not what you can measure." (Objectives in Practice)
- Several latency thresholds in one SLO, e.g. 90% < 1 ms, 99% < 10 ms, 99.9% < 100 ms. "99.9% of Get RPC calls will complete in less than 100 ms." (Defining Objectives)
- An error budget is an SLO for meeting other SLOs. "An error budget is just an SLO for meeting other SLOs!" (Defining Objectives)
- Don't pick a target from current performance alone. "Don’t pick a target based on current performance" (Choosing Targets)
- Have as few SLOs as possible. "Have as few SLOs as possible" (Choosing Targets)
- Start loose and tighten. "It’s better to start with a loose target that you tighten than to choose an overly strict target that has to be relaxed when you discover it’s unattainable." (Choosing Targets)
- SLIs and SLOs form a control loop: measure, compare, decide, act. "Compare the SLIs to the SLOs, and decide whether or not action is needed." (Control Measures)
- Keep a tighter internal SLO than the published one. "Using a tighter internal SLO than the SLO advertised to users gives you room to respond to chronic problems before they become visible externally." (SLOs Set Expectations)
- Don't overachieve: users rely on what you deliver, not what you promise. "Users build on the reality of what you offer, rather than what you say you’ll supply, particularly for infrastructure services." (SLOs Set Expectations)
- SLAs are hard to change once published, so be conservative. "It is wise to be conservative in what you advertise to users, as the broader the constituency, the harder it is to change or delete SLAs that prove to be unwise or difficult to work with." (Agreements in Practice)
- SRE rarely writes SLAs; they're business and product decisions. "SRE doesn’t typically get involved in constructing SLAs, because SLAs are closely tied to business and product decisions." (Agreements)
- Business and legal teams set SLA penalties. "Crafting an SLA requires business and legal teams to pick appropriate consequences and penalties for a breach." (Agreements in Practice)
- Search has no public SLA but outages still cost reputation and ad revenue. "unavailability results in a hit to our reputation, as well as a drop in advertising revenue." (Agreements)
- Copying current performance as the target can lock you into heroics. "adopting values without reflection may lock you into supporting a system that requires heroic efforts to meet its targets" (Choosing Targets)
- Some SRE teams watch only high percentiles. "some SRE teams focus only on high percentile values, on the grounds that if the 99.9th percentile behavior is good, then the typical experience is certainly going to be." (Aggregation)
- SRE's role in an SLA is to judge how likely and hard its SLOs are to meet. "SRE’s role is to help them understand the likelihood and difficulty of meeting the SLOs contained in the SLA." (Agreements in Practice)

## Visuals worth redrawing

- Figure 4-1: 50th, 85th, 95th and 99th percentile latency lines over a
  day, log Y axis. The mean would sit flat while the top line moves.

## My notes

- The chapter doesn't define how to compute a percentile; the
  Prometheus page does (rank φ·N).
