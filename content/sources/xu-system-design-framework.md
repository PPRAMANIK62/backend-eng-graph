---
id: xu-system-design-framework
title: "System Design Interview, chapter: A Framework For System Design Interviews"
author: Alex Xu (ByteByteGo)
url: https://bytebytego.com/courses/system-design-interview/a-framework-for-system-design-interviews
kind: book
primary: false
---

## Summary

The free chapter of Alex Xu's *System Design Interview* course that
gives a four-step process: understand the problem and set the scope,
propose a high-level design, deep dive, wrap up. Uses a news feed as the
running example. Written for interviews.

## Key claims

- The four steps: "Step 1 - Understand the problem and establish design scope", "Step 2 - Propose high-level design and get buy-in", "Step 3 - Design deep dive", "Step 4 - Wrap up". (section headings)
- The process matters more than the final design. "The final design is less important compared to the work you put in the design process." (intro)
- Over-engineering is a red flag. "Over-engineering is a real disease of many engineers as they delight in design purity and ignore tradeoffs." (intro)
- Don't answer before understanding the requirements. "Answering without a thorough understanding of the requirements is a huge red flag as the interview is not a trivia contest." (Step 1)
- Write down assumptions. "If the latter happens, write down your assumptions on the whiteboard or paper. You might need them later." (Step 1)
- Questions to ask include features, number of users, how fast it will grow, and existing tech. "How many users does the product have?" (Step 1 list)
- Back-of-the-envelope math checks the blueprint against the scale. "Do back-of-the-envelope calculations to evaluate if your blueprint fits the scale constraints." (Step 2)
- Whether API and schema belong in the high-level step depends on the problem. "Should we include API endpoints and database schema here? This depends on the problem." (Step 2)
- Wrap-up topics: bottlenecks, error cases, operations, the next scale step. "Never say your design is perfect and nothing can be improved." (Step 4)
- Name the next scale step. "if your current design supports 1 million users, what changes do you need to make to support 10 million users?" (Step 4)
- The right answer depends on who it's for. "A solution designed to solve the problems of a young startup is different from that of an established company with millions of users." (Dos)
- Rough timings in a 45-minute session: step 1 3-10 minutes, step 2 10-15, step 3 10-25, step 4 3-5. (Time allocation on each step)
- Sessions are 45 minutes or an hour. "System design interview questions are usually very broad, and 45 minutes or an hour is not enough to cover the entire design." (Time allocation on each step)
- Ask questions and clarify before designing. "Always ask for clarification. Do not assume your assumption is correct." (Dos)

## Visuals worth redrawing

- The news feed high-level diagrams (feed publishing, feed building);
  not needed.

## My notes

- Secondary and interview-focused. Useful mainly to show that the
  common interview frameworks agree on the order.
