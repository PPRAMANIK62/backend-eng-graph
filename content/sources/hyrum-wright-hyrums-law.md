---
id: hyrum-wright-hyrums-law
title: Hyrum's Law
author: Hyrum Wright
url: https://www.hyrumslaw.com/
kind: blog
primary: true
---

## Summary

A short essay by the Google engineer the law is named after: with
enough users, every observable behavior of a system becomes something
someone depends on, so the implementation becomes the interface.

## Key claims

- The law. "With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody." (top)
- Given enough use, nothing is private. "Given enough use, there is no such thing as a private implementation." (body)
- The result is "bug-for-bug compatibility". "We often refer to this phenomenon as \"bug-for-bug compatibility.\"" (body)
- Performance becomes part of the implicit interface even when not promised. "an interface may make no guarantees about performance, yet consumers often come to expect a certain level of performance from its implementation." (body)
- Eventually the implementation is the interface. "At this point, the interface has evaporated: the implementation has become the interface, and any changes to it will violate consumer expectations." (body)
- Testing can detect these expectations but not remove them. "With a bit of luck, widespread, comprehensive, and automated testing can detect these new expectations but not ameliorate them." (body)
- It came from infrastructure migrations at Google; Titus Winters named it. "credit goes to Titus Winters for actually naming it as \"Hyrum's Law\"" (Who's Hyrum?)
- Hyrum Wright noticed it while a software engineer at Google, from library changes breaking far-off systems. "I'm a Principal Scientist at Adobe, and before that, a software engineer at Google." (Who's Hyrum?)

## Visuals worth redrawing

None.

## My notes

- Undated page. Wright was at Google when he made the observation and
  is at Adobe now, per the page.
