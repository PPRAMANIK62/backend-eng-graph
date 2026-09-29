---
id: huang-metastable-failures-wild-2022
title: Metastable Failures in the Wild
author: Lexiang Huang, Matthew Magnusson, Abishek Bangalore Muralikrishna, Salman Estyak, Rebecca Isaacs, Abutalib Aghayev, Timothy Zhu, Aleksey Charapko
url: https://www.usenix.org/system/files/osdi22-huang-lexiang.pdf
kind: paper
primary: true
---

## Summary

OSDI 2022 follow-up to Bronson et al. The authors read hundreds of public
incident reports and found 22 metastable failures at 11 organizations
(AWS, Google Cloud, Azure, IBM, Spotify, Cassandra and others). They
split triggers into load spikes and capacity drops, and sustaining
effects into workload amplification and capacity degradation, reproduce
several in the lab, and describe a garbage-collection case at Twitter.

## Key claims

- 22 metastable failures from 11 organizations. "we present an in-depth study of 22 metastable failures from 11 different organizations." (Abstract)
- At least 4 of 15 major AWS outages in a decade were metastable. "at least 4 out of 15 major outages in the last decade at Amazon Web Services were caused by metastable failures." (Abstract)
- Two kinds of trigger and two kinds of amplification. "categorizing two types of triggers and two types of amplification mechanisms" (Abstract)
- The same thing has gone by many names. "such as persistent congestion [51], overload [60], cascading failures [5], retry storms [2, 56], death spirals [37], among others." (1 Introduction)
- The root cause isn't a bug or a broken part; it's emergent behavior from common-case optimizations. "A key property of metastable failures is that their root cause is not a specific hardware failure or a software bug." (1 Introduction)
- Cache example: 300 RPS database plus 90% hit-rate cache serves 3,000 RPS, now vulnerable. "an operator of a system with a database that can handle 300 requests per second (RPS) can install a cache with a 90% hit-rate and start serving up to 3,000 RPS." (1 Introduction)
- About 45% of triggers are engineer errors (config, deploys, latent bugs). "Around 45% of observed triggers in Table 1 are due to engineer errors, such as buggy configuration or code deployments, and latent bugs" (2.2)
- About 35% are load spikes; 45% have more than one trigger. "A significant number of cases (45%) have more than one trigger." (2.2)
- Outages lasted 1.5 to 73.53 hours; 4 to 10 hours most common. "we have observed outages in a range of 1.5 to 73.53 hours, with 4 to 10 hours of outages being the most common" (2.2)
- Retry policy is the most common sustaining effect, in more than half. "By far, the most common sustaining effect is due to the retry policy, affecting more than 50% of the studied incidents" (2.2)
- Recovery usually means reducing load. "Recovery from a metastable failure is challenging and often requires reducing load." (2.2)
- Plain overload is not yet metastable; fixing the trigger fixes it. "Getting out of overload is relatively straightforward — fix the trigger and restore the balance in the system" (3)
- Fixing the trigger can itself depend on the degraded system. "Some triggers are more difficult to address since the ability to fix the trigger, ironically, may depend on the system’s performance, which is degraded by the trigger." (3)
- Capacity degradation amplification: overload lowers capacity further, e.g. more GC from a longer queue. "This effect occurs when the initial trigger overloads the system and causes the capacity to degrade or remain degraded." (3.3)
- The smaller the headroom between normal load and capacity, the smaller the trigger needed. "The smaller the Cnorm − Lnorm difference, the smaller the trigger magnitude needed to overload the system and potentially trigger the metastable failure (Theorem 1)." (3)
- Longer triggers make the system more vulnerable. "Since wL and wC increase with the overloading trigger duration ∆ttrig , longer triggers also increase the vulnerability." (3)
- Bronson et al. were the first to put all these under one framework. "Bronson et al. [7] is the first work that generalizes all of these different-looking failures under the same framework." (1 Introduction)
- Load shedding is a common part of recovery. "metastable failures often require significant load shedding [57, 60] for recovery." (2.1 Methodology)

## Visuals worth redrawing

- Figure 1: four scenarios (load-spike or capacity-decreasing trigger, times workload or capacity-degradation amplification), load and capacity lines over time.

## My notes

- Table 1 lists the incidents; AWS3 is the 2015 DynamoDB event (see aws-dynamodb-outage-2015).
- The code for their reproductions is at github.com/lexiangh/Metastability (not opened).
