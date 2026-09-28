---
id: wireshark-users-guide-intro
title: "Wireshark User's Guide, Chapter 1: Introduction"
author: The Wireshark project
url: https://www.wireshark.org/docs/wsug_html_chunked/ChapterIntroduction.html
published: undated (current guide as served 2026-09-28)
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The introduction to Wireshark's own manual: what a packet analyzer is,
what Wireshark does (live capture, opening tcpdump files, protocol
dissectors, display filters, statistics) and what it doesn't.

## Key claims

- Definition. "Wireshark is a network packet analyzer. A network packet analyzer presents captured packet data in as much detail as possible." (1.1 What is Wireshark?)
- It opens captures from tcpdump and other tools. "Open files containing packet data captured with tcpdump/WinDump, Wireshark, and many other packet capture programs." (1.1.2 Features)
- It decodes many protocols with dissectors. (1.1.6 Many protocol dissectors)
- Filters and statistics. "Filter packets on many criteria." (1.1.2 Features)
- It only observes. "Wireshark will not manipulate things on the network, it will only “measure” things from it." (1.1.8 What Wireshark is not)

## Visuals worth redrawing

None.

## My notes

- A common workflow is capturing with tcpdump -w on a server and opening
  the file in Wireshark on a laptop; the tcpdump man page covers -w, this
  page covers opening it.
