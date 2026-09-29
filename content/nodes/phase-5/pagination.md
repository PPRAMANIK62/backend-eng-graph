---
id: pagination
title: Pagination
depth: short
phase: 5
note: >-
  Offset vs cursor, and why offsets break on changing data.
needs: [api-design]
leads_to: []
compare_with: [indexes]
---

# Pagination

A List method (one of the standard methods in [[api-design]]) can't
return a collection that keeps growing in one response. It returns one page, plus a way to ask for the next. How you
point at "the next page" decides two things: whether pages stay correct
while the data changes underneath, and whether page 500 costs the same
as page 1.

## Offsets count rows, and rows move

The obvious way is to number the rows. Page 2 of a list sorted newest
first, ten per page, is:

```sql
SELECT * FROM sales
 ORDER BY sale_date DESC
 LIMIT 10 OFFSET 10
```

In an API that becomes `?page=2` or `?offset=10`. It's easy, and a
client can jump to any page. It has two problems.

**Pages drift.** The numbering starts from scratch on every request.
If a new row arrives between two page fetches, everything shifts down
by one, and the last row of page 1 shows up again at the top of
page 2. A deleted row shifts everything up, and a row gets skipped.

![Four columns of rows. First page, OFFSET 0 LIMIT 3: rows E, D, C. Then a new row F arrives at the top, above E, D, C (already shown) and B, A. With OFFSET 3 LIMIT 3 the next page is C again, then B, A: C is shown twice. With a keyset query, "after row C, LIMIT 3", the next page is B, A, correct.](img/pagination-offset-drift.svg)

*One insert between two page fetches. The offset counts from the new top and repeats a row; the keyset query doesn't notice.*

**Deep pages get slow.** With an offset the database has to count
every row from the start until it reaches the page. The further back a
user pages, the longer each response takes.

## Keyset: start after the last row you saw

The alternative, called keyset pagination or the seek method, remembers
where the last page ended instead of how many rows came before it:

```sql
SELECT * FROM sales
 WHERE (sale_date, sale_id) < (?, ?)
 ORDER BY sale_date DESC, sale_id DESC
 FETCH FIRST 10 ROWS ONLY
```

The two placeholders are the `sale_date` and `sale_id` of the last row
on the previous page. Because the condition is on values, not
positions, an insert elsewhere in the list doesn't move anything, and
the database can use an [[indexes|index]] on those two columns to jump
straight to the right place instead of counting its way there.

Two details make it work:

- **The order must be deterministic.** If two sales share a date,
  "after this date" would skip the rest of that day. Adding a unique
  column (`sale_id`) as a tie-breaker gives every row one fixed
  position.
- **Compare both columns together.** The row-value syntax
  `(a, b) < (x, y)` means "sorts before". Support differs: PostgreSQL
  (since 8.4) can use it to search an index, and some databases need
  the condition written out longhand.

The price: you can't jump to page 37, and going backwards means
reversing every comparison and sort. For infinite scrolling and "next"
buttons, neither matters.

## In the API: an opaque token

Clients shouldn't build keyset queries themselves. Google's API
guidelines give List methods three fields:

- `page_size` in the request: the most results the client wants. It's
  optional, the server documents a default, and a value over the
  maximum is lowered to the maximum, not rejected.
- `page_token` in the request: where to continue.
- `next_page_token` in the response. An empty token is the only signal
  that the list has ended. A page can come back short, or even empty,
  before the end, so "fewer results than I asked for" doesn't mean
  "done".

Microsoft's Azure guidelines do the same with a `nextLink`: a full URL
to `GET` for the next page, left out on the last page.

The token has to be opaque. If clients can decode it, they will, and
then its format is part of your API and you can't change how you page.
Base64 over a readable token doesn't count as opaque. Two more rules:
the token only says where to continue, so every request is still
authorized on its own; and the other parameters (filters, sort) must
stay the same from page to page. Servers that store tokens may expire
them; Google suggests three days as a rule of thumb.

## Paginate from the first version

Adding pagination to a List that used to return everything is a
breaking change, even though it looks like adding fields. Google's
example: a user has 75 items and working code. The API adds pages with
a default size of 50. The old code reads one response, gets 50 items,
and never knows there were more. Client libraries also treat paginated
methods differently, so they break too. Microsoft's guidelines say the
same. So every List should page from day one, with a real default size,
even if the first implementation just slices a small list in memory.

## Where it gets tricky

**Total counts are expensive.** Showing "page 3 of 912" means counting
the whole result. Microsoft advises against returning a count; Google
allows one but lets it be an estimate, as long as the docs say so.

**Pages aren't a snapshot.** Unless the server takes a snapshot, items
can still be skipped or duplicated across pages as data changes, and
Microsoft's guidelines ask you to document that. Keyset pagination
fixes the insert problem shown above; it doesn't freeze the data.

**Offsets still have a place.** For a small list that rarely changes,
where users want numbered pages, an offset is simple and fine.

[[graphql|GraphQL]] APIs face the same choice for every list field.

## What this means when you build

- Give every List `page_size`, `page_token` and `next_page_token` (or
  a `nextLink`) from the first release.
- Implement it with a keyset over a unique, indexed sort order.
- Make tokens opaque, and authorize every page request.
- Don't promise totals or snapshots you can't deliver cheaply.

## Further reading

- [Paging Through Results](https://use-the-index-luke.com/sql/partial-results/fetch-next-page), Markus Winand, Use The Index, Luke. Offset vs seek in SQL: drift, cost, deterministic order and row values.
- [AIP-158: Pagination](https://google.aip.dev/158), Google. The API side: page size and token rules, opaque tokens, and why pagination can't be added later.
- [Microsoft Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md), Microsoft. `nextLink`, and warnings about counts and skipped or duplicated items.
