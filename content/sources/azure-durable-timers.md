---
id: azure-durable-timers
title: Timers in Durable Functions (Azure Functions)
author: Microsoft (Azure Functions docs)
url: https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-timers
kind: docs
primary: true
---

## Summary

Microsoft's docs for durable timers in Durable Functions and the
Durable Task SDKs: what they're for (delays and timeouts), how they're
stored (a queue message that becomes visible at the due time), limits
on long timers, and the timeout pattern of racing a timer against an
activity.

## Key claims

- Durable timers are for delays and timeouts; use them instead of language sleep. "Use durable timers in orchestrator functions instead of sleep or delay APIs that might be built into the language." (intro)
- A timer is a queue message that becomes visible at the due time. "When you create a timer that expires at 4:30 pm UTC, the underlying Durable Task Framework enqueues a message that becomes visible only at 4:30 PM UTC." (Durable timer limitations)
- That message wakes an app that scaled to zero. "If the function app is scaled down to zero instances in the meantime, the newly visible timer message ensures that the function app activates again on an appropriate VM." (Durable timer limitations)
- In JavaScript, Python and PowerShell, timers are limited to six days. "For JavaScript, Python, and PowerShell apps, durable timers are limited to six days." (Durable timer limitations)
- Long timers may be built from shorter ones internally. "Depending on the version of the SDK and storage provider being used, long timers of six days or more might be internally implemented using a series of shorter timers (for example, of three-day durations) until the desired expiration time is reached." (Durable timer limitations)
- Compute the due time from the orchestration's clock. "When calculating a future date for a timer to expire, always use the orchestration context's current time property" (Durable timer limitations)
- The orchestration keeps handling other events while a timer is pending. "Orchestrations continue to process other incoming events while waiting for a timer task to expire." (Use durable timers for delays)
- Cancel timers you don't wait for, or the orchestration won't complete. "The Durable Task Framework doesn't change an orchestration's status to "Completed" until all outstanding tasks, including durable timer tasks, are either completed or canceled." (Use durable timers for timeouts)
- Timing out doesn't stop the activity; the orchestration just ignores it. "This cancellation mechanism using the when-any pattern doesn't terminate in-progress activity function or sub-orchestration executions." (Use durable timers for timeouts)
- Long delays can show up as several internal timers in logs and history. "However, it might be visible in framework logs and the stored history state." (Durable timer limitations)

## Visuals worth redrawing

None.

## My notes

- The docs example sends a billing reminder every day for 10 days.
