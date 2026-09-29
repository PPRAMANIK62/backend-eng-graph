---
id: winand-nested-loops
title: "Nested Loops (Use The Index, Luke: SQL Indexing and Tuning)"
author: Markus Winand
url: https://use-the-index-luke.com/sql/join/nested-loops-join-n1-problem
kind: book
primary: false
---

## Summary

A chapter page from Markus Winand's free web book on SQL indexing. Uses
the ORM "N+1 selects" pattern to explain the nested loops join, then
shows how to get ORMs to issue a real join instead.

## Key claims

- A nested loops join is a driving query plus one lookup per row. "It works like using two nested queries: the outer or driving query to fetch the results from one table and a second query for each row from the driving query to fetch the corresponding data from the other table." (top)
- Doing that from the application adds network latency to each lookup. "Nevertheless that is a troublesome approach because network latencies occur on top of disk latencies—making the overall response time even worse." (top)
- ORMs do this by accident; it's the N+1 problem. "This effect is known as the “N+1 selects problem” or shorter the “N+1 problem” because it executes N+1 selects in total if the driving query returns N rows." (ORM examples)
- A join in SQL does the same index lookups but saves the round trips. "An SQL join is still more efficient than the nested selects approach—even though it performs the same index lookups—because it avoids a lot of network communication." (after the examples)
- Round trips matter more than bytes. "That means that the number of database round trips is more important for the response time than the amount of data transferred." (after the examples)
- Joins repeat the parent's columns for every child row (an employee with 30 sales appears 30 times). "That means that an employee with 30 sales will appear 30 times." (JPA example)
- Nested loops is good when the driving query returns few rows. "The nested loops join delivers good performance if the driving query returns a small result set." (end)

## Visuals worth redrawing

None.

## My notes

- The hash join and sort-merge pages of the same book were opened too
  (not given notes).
