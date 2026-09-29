---
id: lamport-distributed-system-1987
title: "distribution (email to DEC SRC)"
author: Leslie Lamport
url: https://lamport.azurewebsites.net/pubs/distributed-system.txt
kind: blog
primary: true
---

## Summary

A short internal email Leslie Lamport sent at DEC's Systems Research Center
in 1987, now on his website. It holds the often-quoted joke definition of a
distributed system, written because his workstation kept depending on
servers elsewhere.

## Key claims

- The definition. "A distributed system is one in which the failure of a computer you didn't even know existed can render your own computer unusable." (body)
- The trigger was his machine depending more and more on programs running elsewhere. "It seems that each new version of the nub makes my FF more dependent upon programs that run elsewhere." (body)
- He proposed a project to make the system more robust and offered to gather data on such failures. "I therefore propose a development project to make our system more robust." (body)

## Visuals worth redrawing

None.

## My notes

- The point is dependency you can't see: your program fails because of a
  machine you never chose to rely on.
