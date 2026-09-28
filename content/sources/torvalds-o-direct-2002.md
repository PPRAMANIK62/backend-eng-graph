---
id: torvalds-o-direct-2002
title: "Re: O_DIRECT performance impact on 2.4.18"
author: Linus Torvalds
url: https://static.lwn.net/2002/0516/a/lt-deranged-monkey.php3
kind: blog
primary: true
---

## Summary

A linux-kernel mailing list reply (archived by LWN) where Linus Torvalds
attacks the O_DIRECT interface as badly designed, and sketches what he'd
rather have: page cache based reads and writes split into an async
"start I/O" step and a "map or sync" step. A reply to someone arguing
O_DIRECT is useful for databases that keep their own cache.

## Key claims

- The person he replies to says O_DIRECT is for apps with their own cache, like databases. "O_DIRECT is especially useful for applications which maintain their own cache, e.g. a database." (quoted text from Gerrit Huizenga)
- Linus's view of the interface. "The thing that has always disturbed me about O_DIRECT is that the whole interface is just stupid" (first paragraph)
- He says it performs poorly because of the interface: synchronous reads/writes and page-table walking. "It's simply not very pretty, and it doesn't perform very well either" (second paragraph)
- Earlier in the thread he said it needs to be asynchronous to win. "For O_DIRECT to be a win, you need to make it asynchronous." (quoted from his previous mail)
- His alternative for reads: readahead that starts I/O asynchronously, then a mapping that takes pages from the page cache on fault. "(1) readahead: allocate pages, and start the IO asynchronously" (proposal)
- He calls it an "Oracleism", i.e. added for database vendors. "In other words, it's an Oracleism." (footnote)
- (added in review) The two performance problems he names: synchronous I/O and page-table walking. "where synchronocity of read/write is part of it, but the inherent page-table-walking is another issue" (second paragraph)

## Visuals worth redrawing

None.

## My notes

- 2002, kernel 2.4/2.5 era. History and attitude, not a description of
  current O_DIRECT. Rude in places; only the technical point is useful.
