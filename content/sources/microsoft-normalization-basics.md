---
id: microsoft-normalization-basics
title: Description of the database normalization basics
author: Microsoft
url: https://learn.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description
kind: docs
primary: false
---

## Summary

A beginner's page from Microsoft's Access troubleshooting docs (applies
to Access 2013 to 2021). Explains redundancy and "inconsistent
dependency", walks through first, second and third normal form with a
student/advisor/class table, and says when to stop.

## Key claims

- Redundant data creates maintenance problems. "If data that exists in more than one place must be changed, the data must be changed in exactly the same way in all locations." (intro)
- Third normal form is enough for most applications. "Although other levels of normalization are possible, third normal form is considered the highest level necessary for most applications." (Normal forms)
- Repeating columns (Vendor Code 1, Vendor Code 2) are a first normal form problem. "Don't use multiple fields in a single table to store similar data." (First normal form)
- Full third normal form isn't always practical. "EXCEPTION: Adhering to the third normal form, while theoretically desirable, isn't always practical." (Third normal form)
- Many small tables can hurt performance. "However, many small tables may degrade performance or exceed open file and memory capacities." (Third normal form)
- It equates 4NF with BCNF, which other sources list as separate forms. "Fourth normal form, also called Boyce-Codd Normal Form (BCNF), and fifth normal form do exist, but are rarely considered in practical design." (Other normalization forms)
- One student with several classes is a sign of design trouble. "Fields Class1, Class2, and Class3 in the above records are indications of design trouble." (Normalizing an example table)

## Visuals worth redrawing

- The unnormalized student table with Class1, Class2, Class3 columns.

## My notes

- The BCNF claim conflicts with stonebraker-hellerstein-what-goes-around-2005
  and kent-five-normal-forms-1983. Don't repeat it.
