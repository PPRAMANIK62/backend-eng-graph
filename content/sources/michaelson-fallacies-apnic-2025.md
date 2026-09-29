---
id: michaelson-fallacies-apnic-2025
title: "21 years and counting of 'eight fallacies of distributed computing'"
author: George Michaelson (APNIC)
url: https://blog.apnic.net/2025/12/08/21-years-and-counting-of-eight-fallacies-of-distributed-computing/
kind: blog
primary: false
---

## Summary

A network operator's walk through the eight fallacies, one by one, as they
look from the network side in 2025: where the list came from, and what each
fallacy means in terms of loss, delay, jitter, queueing, topology changes,
administrators and cost.

## Key claims

- History: the first four came from Bill Joy and Tom Lyon at Sun, Deutsch added three, Gosling the eighth. "The list began with four original fallacies (the first four in the list), collected by Bill Joy and Tom Lyon" (Where did this list come from?)
- The list is often misquoted with "Dave Lyon". "Several online discussions of these fallacies mistakenly refer to Tom Lyon as Dave Lyon." (Fallacies we believe about fallacy lists)
- The list is for people writing network software, and turns into practical questions: was it sent, was it received, how can you tell, can you send it again. "The list is aimed at people writing network software" (Where did this list come from?)
- IP doesn't guarantee delivery; higher layers must. "Internet Protocol (IP) — whether version four or six — does not guarantee delivery." (1. The network is reliable)
- TCP and QUIC are built largely to detect and handle loss. "Much of the Transport Control Protocol (TCP) and QUIC layers are specifically designed to recognise packet loss and handle it." (1. The network is reliable)
- Latency covers delay and jitter; distance sets a floor, and light in fibre is slower than in a vacuum. "the speed of light in fibre is slower than in a vacuum." (2. Latency is zero)
- Limited bandwidth means queueing, which means delay, jitter and loss. "Dealing with the consequences of ‘less-than-infinite’ bandwidth introduces queuing, which in turn creates delay." (3. Bandwidth is infinite)
- Packets cross providers you have no relationship with; encrypt, and remember traffic analysis still leaks. "Never treat the network as inherently secure" (4. The network is secure)
- Even encrypted packets leak information through traffic analysis of timing and size. "Even protected packets, however, reveal information." (4. The network is secure)
- Topology changes show up to you as loss, delay and jitter. "We experience these topology changes as loss, delay, and jitter." (5. Topology doesn't change)
- Many hands run a network; the admin you talk to isn't the one making changes. "the administrator you speak to is very probably not the one actually making changes in the system." (6. There is one administrator)
- Cost that isn't visible in a protocol still exists. "Just because cost is not exposed directly in a protocol does not mean it doesn't exist" (7. Transport cost is zero)
- Links differ in delay, bandwidth and capacity; IP hides that, higher layers must cope. "The inconsistencies in delay, bandwidth, and load capacity become apparent almost immediately." (8. The network is homogeneous)
- The bandwidth limit you hit is usually your own last link. "the limits of the network are often far removed from us — with one exception: our local home link." (3. Bandwidth is infinite)
- The protocols that handle topology changes (VRRP, CARP, BGP, Multipath TCP) have their own costs. "are not free." (5. Topology doesn't change)
- Some costs show up as pricing, like S3's uneven charges for storing and fetching. "the asymmetric charges for sending and retrieving data from Amazon S3 long-term storage" (7. Transport cost is zero)
- Wi-Fi and Ethernet devices behave very differently. "differences between devices on Wi-Fi and devices on Ethernet can be stark." (8. The network is homogeneous)

## Visuals worth redrawing

None.

## My notes

- Wikipedia (read, not cited) credits "Dave Lyon" and adds that Deutsch
  later proposed a ninth fallacy and that Richards and Ford (2020) added three
  more; this post says "Tom Lyon" is right.
