---
id: kimball-fact-and-dimension-tables-2003
title: Fact Tables and Dimension Tables
author: Ralph Kimball, Kimball Group
url: https://www.kimballgroup.com/2003/01/fact-tables-and-dimension-tables/
kind: blog
primary: true
---

## Summary

Kimball's short article (Intelligent Enterprise, 2003, republished on
the Kimball Group site) on the core of dimensional modeling: numeric
measurements go in fact tables, the descriptive context goes in
dimension tables, and the fact table points at each dimension with a
foreign key. Kimball built and named most of these techniques.

## Key claims

- Dimensional modeling splits the world into measurements and context. "Dimensional modeling begins by dividing the world into measurements and context." (Measurements and Context)
- Numeric measurements are facts. "Measurements are usually numeric and taken repeatedly. Numeric measurements are facts." (Measurements and Context)
- Context is grouped into dimensions such as Product, Store, Time, Customer. "you naturally divide the context into clumps named Product, Store, Time, Customer, Clerk, and several others. We call these logical clumps dimensions" (Measurements and Context)
- A fact table has foreign keys to dimensions plus the measurements. "A fact table in a pure star schema consists of multiple foreign keys, each paired with a primary key in a dimension, together with the facts containing the measurements." (Dimensional Keys)
- Use sequential surrogate keys, not natural keys from the sources. "It’s a major mistake to build data warehouse keys out of the natural keys that come from the underlying data sources." (Dimensional Keys)
- Dimensions change slowly, which needs its own handling (slowly changing dimensions). "you have to account for the slow, episodic change of these dimensions in the way you handle them." (Measurements and Context)
- Dimension tables are left flat (second normal form, "denormalized") because flat tables query faster. "I resist the urge to further snowflake the dimension tables and am content to leave them in flat second normal form because the flat tables are much more efficient to query." (Relating the Two Modeling Worlds)
- Surrogate keys are plain sequentially assigned integers. "build the FK-PK pairs as surrogate keys that are just sequentially assigned integers." (Dimensional Keys)
- The technique for dimension changes is named slowly changing dimensions. "This predicament gives rise to the technique of slowly changing dimensions" (Measurements and Context)

## Visuals worth redrawing

- The star: a fact table in the middle with foreign keys to dimension
  tables around it.

## My notes

- The Kimball Group site also defines star schemas vs OLAP cubes on its
  techniques page; not used.
