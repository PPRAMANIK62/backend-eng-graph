---
id: owasp-logging
title: "Logging Cheat Sheet (OWASP Cheat Sheet Series)"
author: OWASP Cheat Sheet Series contributors
url: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
kind: docs
primary: false
---

## Summary

OWASP's guide to application security logging: which events to always
log, what each entry needs (when, where, who, what), what never to log,
log injection, and how to protect logs from tampering and deletion.
Covers audit trails as one use of logs.

## Key claims

- Audit trails are one security use of logs. "Audit trails e.g. data addition, modification and deletion, data exports" (Purpose, Security use cases)
- Non-repudiation is hard with logs. "the trait non-repudiation is hard to achieve for logs because their trustworthiness is often just based on the logging party being audited properly while mechanisms like digital signatures are hard to utilize here" (Purpose, Security use cases)
- Audit logs are often kept apart from other logs. "Process monitoring, audit, and transaction logs/trails etc. are usually collected for different purposes than security event logging, and this often means they should be kept separate." (Purpose)
- An audit log in the PCI DSS sense. "a PCIDSS audit log will contain a chronological record of activities to provide an independently verifiable trail that permits reconstruction, review and examination to determine the original sequence of attributable transactions." (Purpose)
- The application is the best source, because it knows the user and the action. "The application has the most information about the user (e.g. identity, roles, permissions) and the context of the event (target, action, outcomes)" (Event data sources)
- Use a separate, write-only database account for logs. "When using a database, it is preferable to utilize a separate database account that is only used for writing log data and which has very restrictive database, table, function and command permissions" (Where to record event data)
- Always log authorization failures and higher-risk actions such as user administration and changes to privileges. (Which events to log)
- Every entry needs when, where, who and what. "The application logs must record "when, where, who and what" for each event." (Event attributes)
- Also record action, object, result status and reason. (Event attributes, "Additionally consider recording")
- Don't log session IDs, access tokens, passwords, keys, connection strings, card data and similar; mask, hash or drop them. (Data to exclude)
- Sanitize event data against log injection (CR, LF, delimiters). "Perform sanitization on all event data to prevent log injection attacks e.g. carriage return (CR), line feed (LF) and delimiter characters" (Event collection)
- Logging failures shouldn't take the application down. "Ensure failures in the logging processes/systems do not prevent the application from otherwise running or allow information leakage" (Event collection)
- It shouldn't be possible to turn off logging needed for compliance. "It should not be possible to completely deactivate application logging or logging of events that are necessary for compliance requirements" (Customizable logging)
- Detect when logging stops. "Enable processes to detect whether logging has stopped, and to identify tampering or unauthorized access and deletion" (Deployment and operation, Operation)
- At rest: tamper detection, read-only copies, and log access to logs. "Build in tamper detection so you know if a record has been modified or deleted" (Protection, At rest)
- Copy to read-only media early. "Store or copy log data to read-only media as soon as possible" (Protection, At rest)
- Retention cuts both ways. "Log data, temporary debug logs, and backups/copies/extractions, must not be destroyed before the duration of the required data retention period, and must not be kept beyond this time." (Disposal of logs)
- Always log authentication successes and failures. "Authentication successes and failures" (Which events to log)
- Higher-risk actions to log include admin actions and shared accounts. "Use of default or shared accounts or a "break-glass" account." (Which events to log)
- Also log sensitive-data access and exports. "Access to sensitive data such as payment cardholder data," and "Data import and export including screen-based reports" (Which events to log)
- An interaction identifier links all the events of one request. "The "Interaction identifier" is a method of linking all (relevant) events for a single user interaction" (Event attributes, Note A)
- Record the application identifier. "Application identifier e.g. name and version" (Event attributes, Where)
- Access to logs is itself logged. "All access to the logs must be recorded and monitored (and may need prior approval)" (Protection, At rest)

## Visuals worth redrawing

None.

## My notes

- Doesn't say how to build tamper detection; CloudTrail's digest files
  are one concrete design.
