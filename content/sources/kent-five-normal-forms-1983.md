---
id: kent-five-normal-forms-1983
title: A Simple Guide to Five Normal Forms in Relational Database Theory
author: William Kent
url: https://www.bkent.net/Doc/simple5.htm
kind: paper
primary: false
---

## Summary

A short, informal tutorial on first through fifth normal forms,
published in Communications of the ACM 26(2), 1983, and hosted on the
author's site. Explains each form with a small record and the update
problems it causes, without relational theory. Codd, Fagin and Date
reviewed drafts.

## Key claims

- Normal forms exist to prevent update anomalies and inconsistencies. "The normalization rules are designed to prevent update anomalies and data inconsistencies." (1 Introduction)
- They assume fields change often and make reads more expensive. "They tend to penalize retrieval, since data which may have been retrievable from one record in an unnormalized design may have to be retrieved from several records in the normalized form." (1)
- You don't have to normalize fully when performance matters. "There is no obligation to fully normalize all records when actual performance requirements are taken into account." (1)
- First normal form: no repeating groups. "First normal form excludes variable repeating fields and groups." (2)
- Second normal form is broken when a field depends on part of a composite key (PART, WAREHOUSE, QUANTITY, WAREHOUSE-ADDRESS). "Second normal form is violated when a non-key field is a fact about a subset of a key." (3.1)
- The four problems: repetition, many updates on change, possible inconsistency, and nowhere to store an address with no parts. "If at some point in time there are no parts stored in the warehouse, there may be no record in which to keep the warehouse's address." (3.1)
- Normalizing costs some reads a join. "The normalized design enhances the integrity of the data, by minimizing redundancy and inconsistency, but at some possible performance cost for certain retrieval applications." (3.1)
- Third normal form is broken when a field depends on another non-key field (EMPLOYEE, DEPARTMENT, LOCATION). "Third normal form is violated when a non-key field is a fact about another non-key field" (3.2)
- Summary rule for 2NF and 3NF. "To summarize, a record is in second and third normal forms if every field is either part of the key or provides a (single-valued) fact about exactly the whole key and nothing else." (3.2)
- A functional dependency: two records with the same X can't have different Y. "A field Y is "functionally dependent" on a field (or fields) X if it is invalid to have two records with the same X-value but different Y-values." (3.3)
- Fourth normal form: don't put two independent many-to-many facts in one record (employee, skill, language). "Under fourth normal form, a record type should not contain two or more independent multi-valued facts about an entity." (4.1)
- Normalization doesn't remove every redundancy. "Normalization certainly doesn't remove all redundancies." (5)
- Normal forms only look within one record type; copies across tables can still be redundant. "The normal forms discussed here deal only with redundancies occurring within a single record type." (6)
- The decision to normalize has to weigh read performance. "And, finally, the desirability of normalization has to be assessed, in terms of its performance impact on retrieval applications." (7)
- Fifth normal form is about data that can be rebuilt from smaller pieces with less redundancy. "Fifth normal form deals with cases where information can be reconstructed from smaller pieces of information that can be maintained with less redundancy." (4.2)
- Unavoidable redundancy when facts depend on each other. "Certain redundancies seem to be unavoidable, particularly when several multivalued facts are dependent rather than independent." (5)
- Three tables can each be in 3NF while one is derivable from the others. "For the example concerning employees, departments, and locations, the following records are in third normal form in spite of the obvious redundancy:" (6)
- Under 1NF every record of a type has the same number of fields. "Under first normal form, all occurrences of a record type must contain the same number of fields." (2)
- Functional dependencies need unique, singular identifiers; "John Smith" at two addresses, or one address spelled two ways, precludes one. "Functional dependencies only exist when the things involved have unique and singular identifiers (representations)." (3.3)
- The normal forms are only defined for that case. "functional dependencies and the various normal forms are really only defined for situations in which there are unique and singular identifiers." (3.3)

## Visuals worth redrawing

- The PART/WAREHOUSE record and its split into two records (3.1).

## My notes

- The page's text of the famous rule has a typo ("the key, us the whole
  key"), so the 3.2 summary sentence is quoted instead.
- Plain http:// returned a mod_security error to curl; https:// with a
  browser user agent worked.
