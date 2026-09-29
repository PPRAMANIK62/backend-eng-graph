---
id: man7-clock-gettime
title: clock_getres(2), clock_gettime(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/clock_gettime.2.html
kind: docs
primary: true
---

## Summary

The Linux man page (man-pages 6.19) for reading the system's clocks.
It lists the clock ids and what each one is affected by: the wall
clock (`CLOCK_REALTIME`) jumps and is slewed by NTP, the monotonic
clock never goes backwards, and there are raw, boot-time and TAI
variants.

## Key claims

- The wall clock jumps when someone sets it, and NTP changes its rate. "This clock is affected by discontinuous jumps in the system time (e.g., if the system administrator manually changes the clock), and by frequency adjustments performed by NTP and similar applications via adjtime(3), adjtimex(2), clock_adjtime(2), and ntp_adjtime(3)." (CLOCK_REALTIME)
- The wall clock pretends leap seconds don't exist. "except that it ignores leap seconds; near a leap second it is typically adjusted by NTP to stay roughly in sync with UTC." (CLOCK_REALTIME)
- On Linux the monotonic clock counts from boot. "On Linux, that point corresponds to the number of seconds that the system has been running since it was booted." (CLOCK_MONOTONIC)
- The monotonic clock ignores jumps but still follows NTP's rate changes. "The CLOCK_MONOTONIC clock is not affected by discontinuous jumps in the system time (e.g., if the system administrator manually changes the clock), but is affected by frequency adjustments." (CLOCK_MONOTONIC)
- It never goes backwards, but two reads can return the same value. "All CLOCK_MONOTONIC variants guarantee that the time returned by consecutive calls will not go backwards, but successive calls may—depending on the architecture—return identical (not-increased) time values." (CLOCK_MONOTONIC)
- It stops while the machine is suspended. "This clock does not count time that the system is suspended." (CLOCK_MONOTONIC)
- CLOCK_MONOTONIC_RAW (since Linux 2.6.28) skips NTP's rate changes. "provides access to a raw hardware-based time that is not subject to frequency adjustments." (CLOCK_MONOTONIC_RAW)
- CLOCK_BOOTTIME (since Linux 2.6.39) is monotonic and counts suspend. "identical to CLOCK_MONOTONIC, except that it also includes any time that the system is suspended." (CLOCK_BOOTTIME)
- Leap seconds are planned to stop. "Because leap seconds are planned to be discontinued, its value from now on will likely remain exactly 37 seconds greater than CLOCK_REALTIME's for many years" (CLOCK_TAI)
- The wall clock counts from the Epoch. "Its time represents seconds and nanoseconds since the Epoch." (DESCRIPTION)
- CLOCK_MONOTONIC_RAW also skips suspend. "This clock does not count time that the system is suspended." (CLOCK_MONOTONIC_RAW)

## Visuals worth redrawing

None.

## My notes

- Pair with man7-vdso: clock_gettime usually runs in the vDSO, without
  a real system call.
