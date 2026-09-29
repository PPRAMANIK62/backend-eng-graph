---
id: dwork-partial-synchrony-1988
title: Consensus in the Presence of Partial Synchrony
author: Cynthia Dwork, Nancy Lynch and Larry Stockmeyer
url: https://groups.csail.mit.edu/tds/papers/Lynch/jacm88.pdf
kind: paper
primary: true
---

## Summary

The Journal of the ACM paper (1988) that introduced partial synchrony: a
timing model between synchronous and asynchronous, where a bound on message
delay exists but isn't known, or holds only after some unknown global
stabilization time. It works out how many faulty processors consensus can
tolerate under four fault types (fail-stop, omission, authenticated
Byzantine, Byzantine) in each timing model.

## Key claims

- Three kinds of faulty processor in the introduction: crash (fail-stop), omission, Byzantine. "if they crash (fail-stop faults), fail to send or receive messages when they should (omission faults), or send erroneous messages (Byzantine faults)." (1.1)
- Fail-stop defined: runs correctly, can stop at any time, never restarts. "Processor pi executes correctly, but can stop at any time. Once stopped it cannot restart." (2.2)
- Omission defined: follows the protocol, but some sends or receives silently don't happen. "Faulty processor pi follows its protocol correctly, but Send(m, pj), when executed by pi, might not place m in pj's buffer" (2.2)
- Byzantine: arbitrary behaviour; the authenticated variant can sign messages. "Arbitrary behavior, but messages can be signed with the name of the sending processor in such a way that this signature cannot be forged by any other processor." (2.2)
- If message delay or processor speed has no bound at all (asynchrony), no consensus protocol tolerates even one crash (citing Dolev et al. and Fischer et al.). "then there is no consensus protocol resilient to even one fail-stop fault." (1.1)
- Partial synchrony, version one: a delay bound exists but isn't known in advance. "an upper bound A on message delivery time exists, but we do not know what it is a priori." (1.2)
- Version two: the bound is known but only holds after an unknown global stabilization time (GST). "For each execution there is a global stabilization time (GST), unknown to the processors, such that the message system respects the upper bound A from time GST onward." (1.2)
- Late or lost messages shouldn't be counted as processor faults. "we do not want to consider a late or lost message as a processor fault." (1.2)
- Calling any message slower than a fixed bound a fault fails: pick the bound too small and every processor soon counts as faulty. "if we picked A too small, all the processors could soon be considered faulty" (1.2)
- Safety must hold no matter how asynchronous things get; only termination waits for the bound. "that algorithm cannot possibly violate a safety property even if the message system is completely asynchronous." (1.2)
- Results under partial synchrony: fail-stop or omission needs N ≥ 2t + 1; Byzantine with authentication needs N ≥ 3t + 1. "For fail-stop or omission faults we show that t-resilient consensus is possible iff N ≥ 2t + 1." (1.2)
- Under partial synchrony, signatures don't raise the number of tolerable Byzantine faults. "for partially synchronous communication, authentication does not improve resiliency." (1.2)

## Visuals worth redrawing

- Table I: smallest N for t-resilient consensus, by fault type and timing model.

## My notes

- The PDF's text extraction turns ≥ into "2" in places; quotes above use ≥
  where the scan shows the symbol.
