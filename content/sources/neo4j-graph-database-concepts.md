---
id: neo4j-graph-database-concepts
title: "What is a graph database (Neo4j Getting Started)"
author: Neo4j, Inc.
url: https://neo4j.com/docs/getting-started/graph-database/
kind: docs
primary: true
---

## Summary

Neo4j's introduction to graph databases and the property graph model:
nodes with labels and properties, relationships with a type and a
direction, and the vendor's claim that storing relationships natively
beats joins for traversals.

## Key claims

- A graph database is built from nodes and relationships. "Graph databases are structured through nodes and relationships." (How it works)
- A relationship has a start node, an end node and one type. "Must always have a start node, an end node, and exactly one type." (How it works)
- Relationships have a direction and can carry properties. "Must have a direction." (How it works)
- The pitch against relational joins. "However, relational databases use computing-wise expensive JOIN operations or cross-looks, which are often tied to a rigid data model." (Why use a graph database)
- No joins; relationships are stored with the nodes. "Graph databases do not use JOINs. Rather, relationships are stored natively alongside the data elements (nodes) in a more flexible format" (Why use a graph database)
- What graphs are good for. "Navigate deep hierarchies." (Why use a graph database)
- The questions are about connections. "Many times, a project’s questions and challenges revolve around the relationship between elements, not the elements themselves" (How to use)
- Nodes carry labels and key-value properties. "Hold any number of key-value pairs as properties (e.g., name)." (How it works)
- Relationships can carry properties. "Can have properties, like nodes." (How it works)

## Visuals worth redrawing

None.

## My notes

- Vendor marketing tone; "millions of connections to be accessed per
  second" has no setup, so don't use it as a number.
