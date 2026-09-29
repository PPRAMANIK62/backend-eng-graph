---
id: kimball-scd-type-2
title: "Type 2: Add New Row (Kimball Dimensional Modeling Techniques)"
author: Kimball Group
url: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/
kind: docs
primary: true
---

## Summary

Slowly changing dimension type 2: keep history by adding a new
dimension row, with a new surrogate key, each time an attribute changes.

## Key claims

- Add a row per change. "Slowly changing dimension type 2 changes add a new row in the dimension with the updated attribute values." (Type 2: Add New Row)
- So one member has many rows. "This requires generalizing the primary key of the dimension beyond the natural or durable key because there will potentially be multiple rows describing each member." (Type 2: Add New Row)
- New facts point at the new row. "a new primary surrogate key is assigned and used as a foreign key in all fact tables from the moment of the update until a subsequent change creates a new dimension key and updated dimension row." (Type 2: Add New Row)
- Three extra columns: effective date, expiration date, current-row flag. "A minimum of three additional columns should be added to the dimension row with type 2 changes" (Type 2: Add New Row)

## Visuals worth redrawing

None.

## My notes

None.
