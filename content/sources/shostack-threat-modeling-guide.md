---
id: shostack-threat-modeling-guide
title: The Ultimate Beginner's Guide to Threat Modeling
author: Shostack + Associates (Adam Shostack)
url: https://shostack.org/resources/threat-modeling
kind: blog
primary: true
---

## Summary

A beginner's guide from the firm of Adam Shostack, who wrote the
four-question framework. It separates threat modeling from risk
management, walks through each question with prompts, and describes the
three most common techniques: data flow diagrams, STRIDE and kill chains.

## Key claims

- Threat modeling is a family of repeatable processes. "Threat modeling is a family of structured, repeatable processes that allows you to make rational decisions to secure applications, software, and systems." (What is Threat Modeling?)
- Most approaches follow the four questions. "Most modern threat modeling approaches follow Shostack’s Four Question Framework:" (How do I get started)
- A diagram isn't the whole model. "Sometimes the diagram is even confused for the whole threat model." (How do I get started)
- Asking the four questions alone beats nothing. "Sometimes, threat modeling can be as simple as asking the Four Questions, and that’s way better than no threat modeling at all." (How do I get started)
- Threat modeling vs risk management: finding attack types vs deciding trade-offs. "Risk management: decisions about the trade-offs and ways to deal with the identified problems and threats." (Threat Modeling and Risk Management)
- Prompts for "what can go wrong". "Can someone use it in an unintended way?" (What can go wrong?)
- Responses: mitigate, eliminate, transfer, accept. "Eliminating threats: Remove the feature or interface that creates the threat." (What are we going to do?)
- Checking the work includes tests. "Tests: ensure you have a good test to detect the problem, one that is in line with other software tests and the risks that failures expose." (Did we do a good job?)
- Top three techniques. "Data flow diagrams, STRIDE and kill chains are the top three most common threat modeling techniques and make for great structured processes." (Most common techniques)
- STRIDE names; this guide calls the last one "Expansion of Authority". "Repudiation: Claiming that you didn’t do something or weren’t responsible for an event (doesn’t have to be lying!)" (STRIDE)
- Kill chain steps. "Those steps include: Deliver an exploit Exploit a target Persist or install Engage in command and control (and) Act on Objectives" (Kill Chains)
- Who does risk management. "Often done by risk management staff or lawyers." (Threat Modeling and Risk Management)
- Picking a response can be quick. "You can use implicit agreement when choosing because it can be faster and easier than formal risk management approaches." (What are we going to do?)
- Transfer example. "Have someone else be responsible, like having a customer change default settings." (What are we going to do?)
- Checking the model. "make sure it matches what you built, starting with the diagram." (Did we do a good job?)

## Visuals worth redrawing

None.

## My notes

- Microsoft and OWASP call the E in STRIDE "Elevation of Privilege";
  this guide says "Expansion of Authority violates Authorization".
