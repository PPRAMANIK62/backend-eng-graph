---
id: postgres-json-types
title: "PostgreSQL documentation, 8.14 JSON Types"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/datatype-json.html
kind: docs
primary: true
---

## Summary

The Postgres manual's section on `json` and `jsonb` (read at version
18.6): how the two types store data, advice on designing JSON
documents, containment and existence operators, GIN indexing with the
two operator classes, and subscripting.

## Key claims

- JSON types validate input. "the JSON data types have the advantage of enforcing that each stored value is valid according to the JSON rules." (8.14)
- json stores text and reparses; jsonb stores a parsed binary form. "The json data type stores an exact copy of the input text, which processing functions must reparse on each execution; while jsonb data is stored in a decomposed binary format that makes it slightly slower to input due to added conversion overhead, but significantly faster to process, since no reparsing is needed." (8.14)
- jsonb can be indexed. "jsonb also supports indexing, which can be a significant advantage." (8.14)
- jsonb drops whitespace, key order and duplicate keys. "By contrast, jsonb does not preserve white space, does not preserve the order of object keys, and does not keep duplicate object keys." (8.14)
- Prefer jsonb. "In general, most applications should prefer to store JSON data as jsonb, unless there are quite specialized needs, such as legacy assumptions about ordering of object keys." (8.14)
- JSON null is not SQL NULL. "SQL NULL is a different concept" (Table 8.23)
- jsonb numbers are Postgres numeric; other systems often use doubles and can lose precision. "When using JSON as an interchange format with such systems, the danger of losing numeric precision compared to data originally stored by PostgreSQL should be considered." (8.14)
- JSON is flexible, and both models can live together. "It is quite possible for both approaches to co-exist and complement each other within the same application." (8.14.2)
- Keep a somewhat fixed structure anyway. "it is still recommended that JSON documents have a somewhat fixed structure." (8.14.2)
- An update locks the whole row. "Although storing large documents is practicable, keep in mind that any update acquires a row-level lock on the whole row." (8.14.2)
- Keep documents small and atomic. "Ideally, JSON documents should each represent an atomic datum that business rules dictate cannot reasonably be further subdivided into smaller datums that could be modified independently." (8.14.2)
- Containment (@>) checks whether one document is inside another. "Containment tests whether one jsonb document has contained within it another one." (8.14.3)
- The existence operator only looks at the top level. "On the other hand, the JSON existence operator is not nested: it will only look for the specified key or array element at top level of the JSON value." (8.14.3)
- GIN indexes search keys and key/value pairs across many documents. "GIN indexes can be used to efficiently search for keys or key/value pairs occurring within a large number of jsonb documents (datums)." (8.14.4)
- The default operator class supports ?, ?|, ?&, @>, @? and @@. "The default GIN operator class for jsonb supports queries with the key-exists operators ?, ?| and ?&, the containment operator @>, and the jsonpath match operators @? and @@." (8.14.4)
- An index on the column isn't used for an operator applied to a sub-expression. "However, the index could not be used for queries like the following, because though the operator ? is indexable, it is not applied directly to the indexed column jdoc" (8.14.4)
- An expression index on one key is smaller and faster than a whole-column index. "targeted expression indexes are likely to be smaller and faster to search than a simple index." (8.14.4)
- jsonb_path_ops is usually smaller and more specific. "A jsonb_path_ops index is usually much smaller than a jsonb_ops index over the same data, and the specificity of searches is better" (8.14.4)
- jsonb_path_ops can't answer key-exists queries. "The non-default GIN operator class jsonb_path_ops does not support the key-exists operators, but it does support @>, @? and @@." (8.14.4)
- Subscripting can read and update jsonb. "The jsonb data type supports array-style subscripting expressions to extract and modify elements." (8.14.5)
- The structure inside a document is mostly unenforced. "The structure is typically unenforced (though enforcing some business rules declaratively is possible), but having a predictable structure makes it easier to write queries that usefully summarize a set of “documents” (datums) in a table." (8.14.2)
- jsonb_ops indexes each key and value separately; jsonb_path_ops hashes each value with the keys leading to it. "Basically, each jsonb_path_ops index item is a hash of the value and the key(s) leading to it" (8.14.4)
- JSON is attractive when requirements keep changing. "Representing data as JSON can be considerably more flexible than the traditional relational data model, which is compelling in environments where requirements are fluid." (8.14.2)
- Containment ignores array order and duplicates. "But remember that the order of array elements is not significant when doing a containment match, and duplicate array elements are effectively considered only once." (8.14.3)

## Visuals worth redrawing

- The difference between a jsonb_ops and a jsonb_path_ops GIN entry for
  `{"foo": {"bar": "baz"}}` (three items vs one hashed item), 8.14.4.

## My notes

- The docs don't mention planner statistics for fields inside jsonb.
  That's in heap-avoid-jsonb-2016.
