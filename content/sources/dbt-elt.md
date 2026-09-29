---
id: dbt-elt
title: "Understanding ELT: Extract, Load, Transform"
author: Daniel Poppy, dbt Labs
url: https://docs.getdbt.com/terms/elt
kind: docs
primary: false
---

## Summary

dbt Labs' glossary page on ELT. dbt is a tool for the "T" in ELT, so
this is the view of a vendor that benefits from ELT. Useful for what
ELT looks like in practice: load raw data, transform with SQL inside the
warehouse, keep the raw data so transforms can be rebuilt.

## Key claims

- ELT loads first and transforms inside the warehouse. "In ETL, data is transformed before being loaded into the data warehouse, whereas in ELT, raw data is loaded first and transformations are applied later." (ELT vs ETL)
- The transform uses the warehouse's own compute. "The transformation step occurring within the warehouse, leverages the data warehouse's computational power." (What is ELT?)
- Keeping raw data lets you change transforms after the fact. "We’d always have the raw source data available, and could iterate on how we transformed it after the fact." (What is ELT?)
- A changed field definition can be applied to all history, not just new records. "when we deploy an update to a field definition, the change can apply across all historical data, rather than only newly-created records." (Recreate historical transformations)
- Transforms become rebuildable: same source and logic, same result. "if we recreate the data warehouse with the click of a button or the run of a command, and source data or transformation logic doesn’t change, we get the same results." (Recreate historical transformations)
- ETL still fits where data must be cleaned and validated before it lands, as in finance and healthcare. "ETL is ideal for industries that require strict data governance, such as finance and healthcare." (When to use ELT vs ETL)
- Some of ETL's pain was layered stored procedures, not the order of steps. "this isn’t strictly a problem with ETL vs ELT: this is a problem with using a series of layered stored procedures to perform data transformations." (Trace data model dependencies)
- Typical transforms after loading: casting types, fixing time zones, renaming, joining, testing keys. "Timestamps may be in the incorrect timezone for your reporting" (Transform, list)
- With incremental ETL, a record's meaning depended on when it was transformed. "since records are transformed incrementally, the meaning of records would be time-dependent." (Recreate historical transformations)
- dbt brings version control, dev environments and data tests to the transforms. "dbt certainly would give our developers the tools (version control, easy creation of dev environments, data + schema tests)" (QA test analytics code changes)
- Extract pulls from sources like application databases, marketing tools and CRMs. "data is extracted from various sources such as relational databases, CRM systems, cloud applications, or APIs." (Extract)
- Heavier transforms add business logic and join data together. "Heavily Transformed: Business logic is added, appropriate materializations are established, data is joined together, etc." (Transform)

## Visuals worth redrawing

- The extract, load, transform flow diagram.

## My notes

- History claims ("ETL originated in the 1970s and 1980s") are loose and
  unsourced; not used.
