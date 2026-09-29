---
id: kimball-scd-type-1
title: "Type 1: Overwrite (Kimball Dimensional Modeling Techniques)"
author: Kimball Group
url: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-1/
kind: docs
primary: true
---

## Summary

Slowly changing dimension type 1: overwrite the attribute in place.

## Key claims

- Overwrite and lose history. "the old attribute value in the dimension row is overwritten with the new value; type 1 attributes always reﬂects the most recent assignment, and therefore this technique destroys history." (Type 1: Overwrite)
- Aggregates must be recomputed. "you must be careful that aggregate fact tables and OLAP cubes affected by this change are recomputed." (Type 1: Overwrite)

## Visuals worth redrawing

None.

## My notes

None.
