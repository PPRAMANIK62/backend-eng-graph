---
id: principles-of-chaos
title: Principles of Chaos Engineering
author: Chaos engineering community (started at Netflix)
url: https://principlesofchaos.org/
kind: docs
primary: true
---

## Summary

The short manifesto that defines chaos engineering, last updated in 2019.
A definition, the four-step experiment (steady state, hypothesis,
real-world variables, try to disprove), and five advanced principles,
including running in production and minimizing the blast radius.

## Key claims

- Definition. "Chaos Engineering is the discipline of experimenting on a system in order to build confidence in the system’s capability to withstand turbulent conditions in production." (top)
- Weaknesses it targets include retry storms and cascading failures. "retry storms from improperly tuned timeouts; outages when a downstream dependency receives too much traffic; cascading failures when a single point of failure crashes" (top)
- Step 1: define steady state as a measurable output. "Start by defining ‘steady state’ as some measurable output of a system that indicates normal behavior." (Chaos in Practice)
- Step 2: hypothesize it holds in control and experimental groups. "Hypothesize that this steady state will continue in both the control group and the experimental group." (Chaos in Practice)
- Step 4: try to disprove the hypothesis. "Try to disprove the hypothesis by looking for a difference in steady state between the control group and the experimental group." (Chaos in Practice)
- The harder steady state is to disrupt, the more confidence. "The harder it is to disrupt the steady state, the more confidence we have in the behavior of the system." (Chaos in Practice)
- Measure outputs, not internals; it checks that the system works, not how. "By focusing on systemic behavior patterns during experiments, Chaos verifies that the system does work, rather than trying to validate how it works." (Build a Hypothesis around Steady State Behavior)
- Variables include non-failures like traffic spikes. "Consider events that correspond to hardware failures like servers dying, software failures like malformed responses, and non-failure events like a spike in traffic or a scaling event." (Vary Real-world Events)
- Strong preference for production traffic. "Chaos strongly prefers to experiment directly on production traffic." (Run Experiments in Production)
- Automate and run continuously. "Automate experiments and run them continuously." (Automate Experiments to Run Continuously)
- Minimize blast radius; some short-term harm is allowed. "While there must be an allowance for some short-term negative impact, it is the responsibility and obligation of the Chaos Engineer to ensure the fallout from experiments are minimized and contained." (Minimize Blast Radius)
- Behavior depends on environment and traffic. "Systems behave differently depending on environment and traffic patterns." (Run Experiments in Production)

## Visuals worth redrawing

None.

## My notes

- No stop condition is named here; "minimize blast radius" is the closest. AWS FIS makes the stop condition a first-class part of an experiment (aws-fis-what-is).
