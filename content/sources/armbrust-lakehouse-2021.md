---
id: armbrust-lakehouse-2021
title: "Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics"
author: Michael Armbrust, Ali Ghodsi, Reynold Xin, Matei Zaharia
url: https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf
kind: paper
primary: true
---

## Summary

CIDR 2021 position paper from Databricks arguing that a "lakehouse"
(open file formats like Parquet on cheap object storage, plus a
transactional metadata layer and a fast engine) will replace the
two-tier data lake plus warehouse setup.

## Key claims

- The lakehouse is defined by open formats, ML support and performance. "the Lakehouse, which will (i) be based on open direct-access data formats, such as Apache Parquet, (ii) have firstclass support for machine learning and data science, and (iii) offer state-of-the-art performance." (Abstract)
- The two-tier lake plus warehouse setup is what they argue against. "This two-tier data lake + warehouse architecture is now dominant in the industry in our experience" (1 Introduction)
- Two tiers means ETL twice. "In today’s architectures, data is first ETLed into lakes, and then again ELTed into warehouses, creating complexity, delays, and new failure modes." (1 Introduction)
- Warehouse data goes stale behind the lake. "The data in the warehouse is stale compared to that of the data lake, with new data frequently taking days to load." (1 Introduction, Data staleness)

## Visuals worth redrawing

- Figure 1: first-generation warehouse, two-tier lake + warehouse, and
  lakehouse side by side.

## My notes

- This is advocacy from the company selling a lakehouse. Use it for the
  definition and the argument, and say whose argument it is.
