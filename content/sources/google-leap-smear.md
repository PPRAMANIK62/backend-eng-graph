---
id: google-leap-smear
title: Leap Smear
author: Google (Public NTP)
url: https://developers.google.com/time/smear
kind: docs
primary: true
---

## Summary

Google's page on how it handles leap seconds: instead of stepping
clocks by a second, its time servers run slightly slow for 24 hours
around the leap so the extra second is spread out. It proposes this
noon-to-noon linear smear as a standard and says AWS uses it too.

## Key claims

- Google smears instead of stepping. "instead of applying leap seconds to our servers using clock steps, we have "smeared" the extra second across the hours before and after each leap." (top)
- The proposed standard. "We encourage anyone smearing leap seconds to use a 24-hour linear smear from noon to noon UTC." (Our proposed standard smear)
- The rate change is small. "The change for the smear is about 11.6 ppm." (Our proposed standard smear)
- AWS uses the same smear. "Amazon uses this smear in AWS." (Our proposed standard smear)
- During the smear clocks run slow. "During the smear, clocks run slightly slower than usual." (Example of the standard smear)
- Smeared time differs from UTC by up to about half a second at the leap. "At the beginning of the leap second, smeared time is just under 0.5 s behind UTC." (Example of the standard smear)
- Smearing since 2008. "Since 2008, instead of applying leap seconds to our servers using clock steps, we have "smeared" the extra second across the hours before and after each leap." (top)
- Machines run on quartz oscillators with their own rate errors. "This is within the manufacturing and thermal errors of most machines' quartz oscillators, and well under NTP's 500 ppm maximum slew rate." (Our proposed standard smear)
- A leap second adds a second to UTC. "UTC inserts an additional second" (Example of the standard smear)

## Visuals worth redrawing

- The table of TAI, UTC and smeared time around a leap. Not redrawn.

## My notes

- Google's NTP FAQ (not given a note) recommends not mixing smeared and
  non-smeared servers.
