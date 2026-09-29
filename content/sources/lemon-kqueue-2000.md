---
id: lemon-kqueue-2000
title: "Kqueue: A generic and scalable event notification facility"
author: Jonathan Lemon
url: https://people.freebsd.org/~jlemon/papers/kqueue.pdf
kind: paper
primary: true
---

## Summary

The design paper for FreeBSD's kqueue, by its author. It explains why
select and poll stop scaling (the whole list goes in and out on every
call, and the kernel keeps no state between calls), then designs a
stateful replacement where interest is registered once and only active
events come back. Presented at BSDCon 2000 (the PDF doesn't print the
year; Kegel's C10K page gives it); measurements on FreeBSD 4.3-RC.

## Key claims

- select and poll make the application pass the whole list on every call. "The poll() and select() interfaces suffer from the deficiency that the application must pass in an entire list of descriptors to be monitored, for every call." (2 Problem)
- In practice only a few hundred of many thousands are active. "practical experience has shown that typically only a few hundred actually have any activity, making 95% of the copies unnecessary." (2 Problem)
- The application then walks the whole list again to find the active ones. "Walking the list is an O(N) activity, which does not scale well as N gets large." (2 Problem)
- When the call sleeps, the list is walked three times. "This leads to 3 passes over the descriptor list in the case where poll or select actually sleep" (2 Problem)
- The root cause: the kernel keeps no state between calls. "These problems stem from the fact that poll() and select() are stateless by design" (2 Problem)
- kqueue events are level-triggered by default, so a partial read still gets notified next time. "an event is be reported as long as a specified condition holds, rather than when activity is actually detected from the event source." (3 Design Goals)
- Many packets are coalesced into one event, so memory for events is bounded. "The result of the above scenario is that multiple packets are coalesced into a single event." (3 Design Goals)
- One kevent() call both registers changes and returns events. "By combining the registration and retrieval process, the number of system calls needed is reduced." (4 Kqueue API)
- Registering a descriptor costs about twice a poll() call, so for a descriptor watched once kqueue gains nothing. "it takes twice as long to add a new knote to a kqueue as opposed to calling poll." (7 Performance)
- Test machine: Pentium III 600 MHz, 512 MB, FreeBSD 4.3-RC. (7 Performance)
- Committed to FreeBSD in 2000. "This API was implemented in FreeBSD and committed to the main CVS tree" (the sentence ends with the month and year, 2000) (9 Conclusion)

## Visuals worth redrawing

- The three passes over the list in a sleeping select/poll call, against
  a registered interest set that returns only active descriptors.

## My notes

- The typo "is be reported" is in the original.
- kqueue(2) on FreeBSD says it first appeared in FreeBSD 4.1.
