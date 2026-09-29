---
id: stonebraker-pavlo-what-goes-around-2024
title: What Goes Around Comes Around... And Around...
author: Michael Stonebraker, Andrew Pavlo
url: https://db.cs.cmu.edu/papers/2024/whatgoesaround-sigmodrec2024.pdf
kind: paper
primary: true
---

## Summary

The 2024 follow-up to the 2005 "What Goes Around Comes Around", in
SIGMOD Record 53(2). It reviews twenty more years of attempts to replace
the relational model or SQL (MapReduce, key-value stores, document
databases, wide-column, text search, array, vector, graph) and argues
that each either stayed niche or converged back to SQL and relational
systems, while implementations changed a lot (columnar, cloud,
lakehouses, NewSQL).

## Key claims

- The relational model and SQL are still the dominant choice, and SQL absorbs good ideas from rivals. "But the RM continues to be the dominant data model and SQL has been extended to capture the good ideas from others." (Abstract)
- Old non-relational systems persist because data is sticky, not because they're good. "This persistence is more of a testament to the “stickiness” of data rather than the lasting power of these systems." (1 Introduction, across a page break)
- Many NoSQL systems now expose SQL-like interfaces. "Many systems that started out rejecting the RM with much fanfare (think NoSQL) now expose a SQL-like interface for RM databases." (1 Introduction)
- With a key-value store the application must do joins itself. "Likewise, developers must implement joins or multi-get operations in their application." (2.2 Key/Value Stores)
- Relational systems can emulate key-value stores, not the reverse. "It is not trivial to reengineer a KV store to make it support a complex data model, whereas RDBMSs easily emulates KV stores without any changes." (2.2)
- Document databases market nesting as faster because it avoids N+1 queries. "They also claim that denormalizing entries into nested structures is better for performance because it removes the need to dispatch multiple queries to retrieve data related to a given object (i.e., “N+1 problem” in ORMs)." (2.3 Document Databases)
- The three old problems with denormalization. "The problems with denormalization/prejoining is an old topic that dates back to the 1970s [116]: (1) if the join is not one-to-many, then there will be duplicated data, (2) prejoins are not necessarily faster than joins, and (3) there is no data independence." (2.3)
- Almost every NoSQL database added SQL by the end of the 2010s. "Despite strong protestations that SQL was terrible, by the end of the 2010s, almost every NoSQL DBMS added a SQL interface." (2.3)
- MongoDB was the last to add SQL, for Atlas in 2021. "The last holdout was MongoDB, but they added SQL for their Atlas service in 2021 [42]." (2.3)
- The SQL standard added JSON in 2016. "But the SQL standard added a JSON data type and operations in 2016 [165, 178]." (2.3)
- Higher-level languages are preferred to record-at-a-time code. "Higher level languages are almost universally preferred to record-at-a-time notations as they require less code and provide greater data independence." (2.3)
- The optimizer is the hardest part of a database system. "But the optimizer remains the hardest part of building a DBMS." (2.3)
- ORMs trade the ability to push logic into the database for portability, and developers fall back to hand-written SQL. "Developers fall back to writing explicit database queries to override the poor auto-generated queries." (4 Parting Comments)
- Key/value is the simplest model. "The key/value (KV) data model is the simplest model possible." (2.2)
- The value is an opaque blob and the application owns the schema. "The value is typically an untyped array of bytes (i.e., a blob), and the DBMS is unaware of its contents." (2.2)
- Usually just get, set and delete. "Most KV DBMSs only provide get/set/delete operations on a single value." (2.2)
- KV stores trade features for predictable speed. "Such systems offer higher and more predictable performance, compared to a RDBMS, in exchange for more limited functionality." (2.2)
- With multiple fields per record, KV is a poor fit: no secondary indexes, joins in the app. "If an application requires multiple fields in a record, then KV stores are probably a bad idea." (2.2)
- Some KV stores grew into record stores with JSON values (DynamoDB, Aerospike). "Such systems replace the opaque value with a semi-structured value, such as a JSON document." (2.2)
- Document model: a hierarchy of field/value pairs. "Each document contains a hierarchy of field/value pairs, where each field is identified by a name and a field’s value can be either a scalar type, an array of values, or another document." (2.3)
- The two NoSQL selling points: SQL and joins are slow, ACID is unnecessary. "First, SQL and joins are slow, and one should use a “faster” lower-level, record-at-a-time interface. Second, ACID transactions are unnecessary for modern applications" (2.3)
- Column-family is not columnar storage; it's one level of nesting. "Despite its name, column-family is not a columnar data model. Instead, it is a reduction of the document data model that only supports one level of nesting instead of arbitrary nesting" (2.4)
- Cassandra and HBase copied Bigtable, limits included. "They also copied BigTable’s limitations, including the lack of joins and secondary indexes." (2.4)
- Property graphs: a directed multigraph with key/value labels. "With property graphs, the DBMS maintains a directed multi-graph structure that supports key/value labels for nodes and edges." (2.8)
- Graph databases win on long pointer chains. "Such an architecture is advantageous for traversing long edge chains since it will do pointer chasing, whereas a RDBMS has to do this via joins." (2.8)
- Any graph fits in two tables. "the key challenge these systems have to overcome is that it is possible to simulate a graph as a collection of tables" (2.8)
- SQL:2023 added property graph queries (SQL/PGQ). "More recently, SQL:2023 introduced property graph queries (SQL/PGQ) for defining and traversing graphs in a RDBMS" (2.8)
- They predict document and relational systems will converge. "Such NoSQL systems are on a collision course with RDBMSs." (2.9)
- IMS is the hierarchical model, CODASYL the network model. "Hierarchical (e.g., IMS): late 1960s and 1970s" and "Network (e.g., CODASYL): 1970s" (1 Introduction, list)
- Key-value stores have no secondary indexes. "Not only must the application parse record fields, but also there are no secondary indexes to retrieve other fields by value." (2.2)
- In a KV store the application owns the schema. "It is up to the application to maintain the schema and parse the value into its corresponding parts." (2.2)
- NoSQL systems that added SQL-like languages. "Notable examples include DynamoDB PartiQL [56], Cassandra CQL [15], Aerospike AQL [9], and Couchbase SQL++ [72]." (2.3)
- Many also added ACID transactions. "Many of the remaining NoSQL DBMSs also added strongly consistent (ACID) transactions (see Sec. 3.4)." (2.3)
- What still separates document stores from relational ones: JSON and "schema later". "The main differences between them seems to be JSON support and the fact that NoSQL vendors allow “schema later” databases." (2.3)
- Plain SQL is awkward for graph traversal. "But “vanilla” SQL is not expressive enough for graph queries and thus require multiple client-server roundtrips for traversal operations." (2.8)
- A cited study: SQL/PGQ in DuckDB beat a leading graph database by up to 10 times (the PDF renders the times sign oddly). "recent work showed how SQL/PGQ in DuckDB outperforms a leading graph DBMS by up to 10" (2.8)
- Their verdict on key/value stores. "These can generally be equaled or beaten by modern high-performance RDBMSs." (2.9)

## Visuals worth redrawing

None.

## My notes

- Reference [116] for denormalization dates back to Codd's 1970s work.
- Openly a relational-side argument; pair it with the builders' own docs
  (Dynamo, Bigtable, MongoDB, Neo4j, DynamoDB) for the other side in
  `data-models`.
