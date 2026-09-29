---
id: nichols-jupiter-1995
title: "High-Latency, Low-Bandwidth Windowing in the Jupiter Collaboration System"
author: David A. Nichols, Pavel Curtis, Michael Dixon, John Lamping (Xerox PARC)
url: https://lively-kernel.org/repository/webwerkstatt/projects/Collaboration/paper/Jupiter.pdf
kind: paper
primary: true
---

## Summary

The UIST '95 paper behind client-server operational transformation.
Jupiter keeps every shared widget's state on a central server. Clients
apply their own edits at once, and a transform function (`xform`) fixes
up messages that crossed in flight so client and server end in the
same state. Each client only syncs with the server, and the server
serializes all changes and echoes them to the others, which turns an
n-way problem into many two-way ones.

## Key claims

- State lives on a central server. "The state of the Jupiter virtual world, including application code written by users, is stored and (for code) executed in a central server shared by all of the users." (Abstract)
- Clients sync only with the server, which serializes and echoes. "Instead, each client synchronizes with the server, the server serializes all changes and echoes changes made by one client to all others that are sharing the widget." (5)
- That turns n-way sync into many two-party syncs. "This lets us achieve n-way synchronization by running independent two-party synchronization protocols on each client-server link." (5)
- The worked conflict: client deletes the fourth character, server the second. "The client has deleted the fourth character, "D", while the server has deleted the second one, "B"." (Figure 3)
- The fix is to rewrite the client's delete. "The fix is to have the server transform the client's message into "del 3" so that both client and server get the same result." (Figure 3)
- xform maps a pair of crossed messages to fixed-up versions. "The general tool for handling conflicting messages is a function, xform, that maps a pair of messages to the fixed up versions." (5)
- The property xform must have. "The messages c' and s' must have the property that if the client applies c followed by s', and the server applies s followed by c', then the client and server will wind up in the same final state." (5)
- Converging isn't enough; the result must make sense. "For example, the function xform(c, s) = {delete everything, delete everything} would satisfy our ordering property, but would probably not satisfy many users!" (5)
- For two deletes, shift the later index. "That is, we modify the later index in the document to account for the earlier deletion." (5)
- Clients apply their own changes without waiting. "The client always applies user changes (such as moving a slider or typing new text) immediately, without waiting for a server response, thereby providing users with immediate feedback." (1)
- Some operation pairs are harder than two deletes. "Other pairs of operations present more difficulties; Section 7 talks about the issues in designing transformations in more detail." (5)

## Visuals worth redrawing

- Figure 3: "ABCDE", client `del 4`, server `del 2`, and the transformed
  result. Redrawn for `realtime-sync`.
- Figure 4: the client/server state space grid.

## My notes

- The pdftotext output interleaves the two columns; quotes were checked
  against a flowed extraction.
