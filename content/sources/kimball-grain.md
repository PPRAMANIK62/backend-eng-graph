---
id: kimball-grain
title: "Declare the Grain (Kimball Dimensional Modeling Techniques)"
author: Kimball Group
url: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/
kind: docs
primary: true
---

## Summary

The Kimball Group's definition of a fact table's grain: what one row
means. Declared first, before dimensions and facts.

## Key claims

- Grain is the pivotal step. "Declaring the grain is the pivotal step in a dimensional design." (Declare the Grain)
- What it means. "The grain establishes exactly what a single fact table row represents." (Declare the Grain)
- Declare it first. "The grain must be declared before choosing dimensions or facts because every candidate dimension or fact must be consistent with the grain." (Declare the Grain)
- Prefer the atomic grain. "Atomic grain refers to the lowest level at which data is captured by a given business process." (Declare the Grain)
- Why atomic. "We strongly encourage you to start by focusing on atomic-grained data because it withstands the assault of unpredictable user queries" (Declare the Grain)
- Don't mix grains. "different grains must not be mixed in the same fact table." (Declare the Grain)

## Visuals worth redrawing

None.

## My notes

None.
