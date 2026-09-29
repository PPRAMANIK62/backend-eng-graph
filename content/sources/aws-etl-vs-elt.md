---
id: aws-etl-vs-elt
title: What's the Difference Between ETL and ELT?
author: Amazon Web Services
url: https://aws.amazon.com/compare/the-difference-between-etl-and-elt/
kind: docs
primary: false
---

## Summary

AWS's comparison page for ETL and ELT. Vendor explainer, broad strokes.
Useful for the plain definitions and for the cases where it still
recommends ETL (legacy sources, filtering high-frequency sensor data at
the edge).

## Key claims

- ETL transforms on a separate processing server before loading. "You use a secondary processing server to transform that data" (ETL process, step 2)
- ELT loads raw data and transforms it in the target. "With ELT, all data cleansing, transformation, and enrichment occur within the data warehouse." (ELT process)
- ETL needs the target design up front. "The ETL process requires more definition at the beginning." (intro)
- For personal data, ETL can mask PII before it reaches the warehouse, with custom work. "In ETL, developers have to build custom solutions, like masking PII to monitor and protect data." (Security)
- ETL still fits IoT data: filter and average high-frequency values before loading. "You want to filter high-frequency data, perform averaging functions on large datasets, then load averaged or filtered values at a reduced rate" (IoT applications)
- Both can be used together in one organization. "ETL and ELT may both be used together for complex analytics that use multiple data formats from varied sources." (Complex analytics)
- ETL needs the target types, structures and relationships defined up front. "Analytics must be involved from the start to define target data types, structures, and relationships." (intro)

## Visuals worth redrawing

None.

## My notes

- The page states "ELT is faster than ETL" flatly; that's marketing, not
  a measured claim. Not used.
