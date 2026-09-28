---
id: man7-ip-rule
title: ip-rule(8), Linux manual page
author: iproute2 developers
url: https://man7.org/linux/man-pages/man8/ip-rule.8.html
kind: docs
primary: true
---

## Summary

The man page for `ip rule`, which edits Linux's routing policy database
(RPDB): an ordered list of rules that decides which routing table to
look in. The man7.org rendering was built from iproute2 git fetched
when this was written; the page's own footer date is from 2011.

## Key claims

- Classic routing looks only at the destination. "Classic routing algorithms used in the Internet make routing decisions based only on the destination address of packets" (DESCRIPTION)
- Policy routing looks at more: source, protocol, ports, even payload. "In some circumstances, we want to route packets differently depending not only on destination addresses but also on other packet fields" (DESCRIPTION)
- The destination table is ordered by longest match; the RPDB replaces it with a rule list. "the conventional destination based routing table, ordered according to the longest match rule, is replaced with a 'routing policy database'" (DESCRIPTION)
- At boot there are three rules: priority 0 looks up table local (255), 32766 looks up main (254), 32767 looks up default (253, empty). "Priority: 0, Selector: match anything, Action: lookup routing table local (ID 255)." (DESCRIPTION)
- Rules are scanned in order; lower number is higher priority. "note that a lower number means higher priority" (DESCRIPTION)

## Visuals worth redrawing

None.

## My notes

- This is how "which table?" is decided before "which route?".
