---
id: winand-paging-through-results
title: "Paging Through Results (Use The Index, Luke)"
author: Markus Winand
url: https://use-the-index-luke.com/sql/partial-results/fetch-next-page
kind: book
primary: false
---

## Summary

A chapter of Winand's free online book on SQL indexing. It compares the
offset method with the seek (keyset) method for fetching the next page:
what each costs the database, why offsets drift when rows are inserted,
and how to write a keyset query with a deterministic order.

## Key claims

- Two methods: offset numbers rows and discards the earlier ones; seek starts after the last row seen. "The second method, which I call the seek method, searches the last entry of the previous page and fetches only the following rows." (intro)
- Offset is easy and can jump to any page. "Besides the simplicity, another advantage of this method is that you just need the row offset to fetch an arbitrary page." (offset method)
- But the database still counts every row before the page. "Nevertheless, the database must count all rows from the beginning until it reaches the requested page." (offset method)
- Two disadvantages: drift and growing response time. "This has two disadvantages: (1) the pages drift when inserting new sales because the numbering is always done from scratch; (2) the response time increases when browsing further back." (offset method)
- Seek uses the last value of the previous page, which an index can use. "Instead of a row number, you use the last value of the previous page to specify the lower bound." (seek method)
- And gives stable results under inserts. "On top of that, you will also get stable results if new rows are inserted." (seek method)
- Paging needs a deterministic order: add a unique column to break ties. "Paging requires a deterministic sort order." (Important box)
- The keyset condition with row values. "WHERE (sale_date, sale_id) < (?, ?)" (seek method, example)
- Row-value support differs by database; PostgreSQL has it since 8.4. "Db2 (only LUW, since 10.1) and PostgreSQL (since 8.4), however, have a proper support of row value predicates and uses them to access the index if there is a corresponding index available." (SQL Row Values box)
- The difference shows from about page 20 in the chapter's measurement. "the difference is clearly visible from about page 20 onwards." (Figure 7.4 text)
- Seek can't jump to arbitrary pages, and going backwards reverses every comparison. "you also cannot fetch arbitrary pages. Moreover you need to reverse all comparison and sort operations to change the browsing direction." (closing)
- Databases without proper row-value support can use a longhand version. "Nevertheless it is possible to use an approximated variant of the seek method with databases that do not properly support the row values" (SQL Row Values box)
- Skipping pages and browsing backwards aren't needed for infinite scrolling. "Precisely these two functions—skipping pages and browsing backwards—are not needed when using an infinite scrolling mechanism for the user interface." (closing)
- Without a unique tie-breaker, "after this date" skips the rest of that day. "this method does not work if there is more than one sale per day" (seek method)

## Visuals worth redrawing

- Figure 7.2 vs 7.3: the index range scanned by offset vs seek.
- The drift picture from the companion post "We need tool support for
  keyset pagination" (use-the-index-luke.com/no-offset): a row inserted
  between two page fetches shows up twice. The pagination figure is our
  own drawing of the same idea.

## My notes

- The "about page 20" is from Winand's chart, whose setup the page
  doesn't give in detail, so the article doesn't use it as a number.
- Companion post (no-offset) opened too; says the same about drift and
  lists frameworks with keyset support. Not given a note.
