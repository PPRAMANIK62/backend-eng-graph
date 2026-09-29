---
id: fischer-consensus-impossibility-1985
title: Impossibility of Distributed Consensus with One Faulty Process
author: Michael J. Fischer, Nancy A. Lynch and Michael S. Paterson
url: https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf
kind: paper
primary: true
---

## Summary

The FLP paper (Journal of the ACM, 1985; first presented in 1983). In a
fully asynchronous system, where nobody can tell a dead process from a
slow one, every consensus protocol has a run that never decides, even if
only one process may crash and messages are never lost. The proof shows
there's always an undecided ("bivalent") starting state, and that an
adversarial scheduler can always delay one message to keep it undecided.

## Key claims

- The result. "In this paper, it is shown that every protocol for this problem has the possibility of nontermination, even with only one faulty process." (Abstract)
- Stated as a surprise: one unannounced process death is enough. "In this paper, we show the surprising result that no completely asynchronous consensus protocol can tolerate even a single unannounced process death." (1)
- It holds even with a reliable network that delivers every message exactly once. "we assume that the message system is reliable" (1; PDF runs "reliableit" together)
- Messages can be delayed arbitrarily and arrive out of order. "Every message is eventually delivered as long as the destination process makes infinitely many attempts to receive, but messages can be delayed, arbitrarily long, and delivered out of order." (1)
- The paper's motivating example is the transaction commit problem. "A well-known form of the problem is the “transaction commit problem,” which arises in distributed database systems" (1)
- Asynchronous means no assumptions about speeds, delays or synchronized clocks, so no timeouts. "We also assume that processes do not have access to synchronized clocks, so algorithms based on time-outs, for example, cannot be used." (1)
- No way to detect a death. "Finally, we do not postulate the ability to detect the death of a process, so it is impossible for one process to tell whether another has died (stopped entirely) or is just running very slowly." (1)
- It applies to a very weak form of consensus: a single bit, and only some process has to decide. "For the purpose of the impossibility proof, we require only that some process eventually make a decision." (1)
- The reliable network is spelled out: every message delivered correctly, exactly once. "it delivers all messages correctly and exactly once." (1; PDF runs "reliableit" together)
- The window of vulnerability defined. "an interval of time during the execution of the algorithm in which the delay or inaccessibility of a single process can cause the entire algorithm to wait indefinitely." (1)
- Every commit protocol has a "window of vulnerability". "It follows from our impossibility result that every commit protocol has such a “window,” confirming a widely believed tenet in the folklore." (1)
- A process is faulty if it takes finitely many steps; runs allow at most one faulty process. "A run is admissible provided that at most one process is faulty and that all messages sent to nonfaulty processes are eventually received." (2)
- The theorem. "No consensus protocol is totally correct in spite of one fault." (3, Theorem 1)
- Proof step one: some initial configuration isn't yet decided. "First, we argue that there is some initial configuration in which the decision is not already predetermined." (3)
- Proof step two: a run that never takes the deciding step. "Second, we construct an admissible run that avoids ever taking a step that would commit the system to a particular decision." (3)
- Bivalent and univalent defined (both decisions still reachable, or only one). "Let C be a configuration and let V be the set of decision values of configurations reachable from C." (3)
- Some single step takes the system from bivalent to univalent; that step fixes the decision, and the proof shows it can always be avoided. "Such a step determines the eventual decision value." (3)
- In the constructed run every process takes infinitely many steps and receives every message, so the run is admissible (no process actually fails). "In any infinite sequence of such stages every process takes infinitely many steps and receives every message sent to it." (3)
- Lemma 2's proof: two adjacent initial configurations differ in one process p's input; consider a deciding run in which p takes no steps. "in which process p takes no steps" (3, Lemma 2)
- If no process dies during the run and a majority is alive at the start, consensus is possible. "There is a partially correct consensus protocol in which all nonfaulty processes always reach a decision, provided no processes die during its execution and a strict majority of the processes are alive initially." (4, Theorem 2)
- It doesn't mean the problem can't be solved in practice; it calls for more realistic models or weaker requirements, such as termination with probability 1. "These results do not show that such problems cannot be “solved” in practice" (5)

## Visuals worth redrawing

- Figures 1 to 3 (commutativity of schedules, the proof's case analysis);
  too formal for a backend article. A "bivalent → keep delaying one message"
  sketch would be our own drawing.

## My notes

- The paper was first presented at PODS in 1983.
