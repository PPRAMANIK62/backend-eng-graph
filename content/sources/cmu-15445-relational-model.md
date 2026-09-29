---
id: cmu-15445-relational-model
title: "Lecture #01: Relational Model & Algebra (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/01-relationalmodel.pdf
kind: docs
primary: false
---

## Summary

Lecture notes for CMU's database systems course, Fall 2024 edition.
Starts from a "database as CSV files" strawman, shows what breaks, then
introduces the relational model (relations, tuples, keys, constraints),
declarative vs procedural languages, relational algebra with SQL
equivalents, and other data models.

## Key claims

- Keeping each entity in its own CSV file leaves integrity, implementation and durability problems to the application. "What happens if we delete an artist that has albums?" (2 Flat File Strawman)
- In early database systems the physical layout lived in application code. "In early DBMSs, the physical layer was defined in the application code (as opposed to being abstracted away), so if database administrators wanted to change how data was stored, they would need to change all of the application code to match the new physical layer." (3)
- Codd proposed the relational model in 1969 to stop rewrites whenever storage changed. "In 1969, he proposed the relational model to avoid this." (4 Relational Model)
- Its three ideas. "Store database in simple data structures (relations)" / "Physical storage left up to the DBMS implementation" / "Access data through a high-level language, where the DBMS figures out best execution strategy" (4)
- A relation is unordered, so the database can store it however it likes. "Since the relationships are unordered, the DBMS can store them in any way it wants, allowing for optimization." (4)
- Unlike the math, real relations may hold duplicates. "It is possible to have repeated / duplicated elements in a relation." (4)
- Values used to be atomic; now they can be lists or nested structures. "In the past, values had to be atomic or scalar, but now values can also be lists or nested data structures." (4)
- NULL means the attribute is undefined for that tuple. "Every attribute can be a special value, NULL, which means for a given tuple the attribute is undefined." (4)
- Primary key and foreign key. "A relation’s primary key uniquely identifies a single tuple in a table." and "Generally, the foreign key will point / be equal to a primary key in another table." (4)
- Constraints, most commonly unique and foreign key. "Unique key and referential (foreign key) constraints are the most common." (4)
- Declarative languages say what, not how. "Non-Procedural (Declarative): The query specifies only what data is wanted and not how to find it." (5)
- Relational algebra operators each take relations and return a relation, so they chain. "Each operator takes in one or more relations as inputs, and outputs a new relation." (6)
- Filtering before a join gives the same answer but can be far cheaper; SQL lets the database choose. "These two statements will always produce the same answer." (6, Observation)
- The document model brings back flat-file problems. "While there are certainly use cases for this model, it still runs into many of the problems discussed in the flat file strawman example discussed earlier." (7 Other Data Models)
- The relational algebra operators covered include selection, projection, union, intersection, difference, product and join. "Projection takes in a relation and outputs a relation with tuples that contain only specified attributes." (6, Projection)
- Product is every combination of tuples. "Product takes in two relations and outputs a relation that contains all possible combinations for tuples from the input relations." (6, Product)

## Visuals worth redrawing

None.

## My notes

- Also mentions that a relation may contain duplicates in practice,
  unlike Codd's definition.
