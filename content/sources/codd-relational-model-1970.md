---
id: codd-relational-model-1970
title: A Relational Model of Data for Large Shared Data Banks
author: E. F. Codd
url: https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf
kind: paper
primary: true
---

## Summary

The paper that started relational databases, published in Communications
of the ACM 13(6), 1970. Codd argues that programs of the day broke
whenever the way data was stored changed (its order, its indexes, its
tree or network paths), and proposes that users see data only as
relations (tables of rows), with keys to link them and a declarative
language to query them. It also introduces normalization and a first
treatment of redundancy and consistency. Read from a scanned copy hosted
for a UPenn course; the text layer has OCR errors, so quotes below were checked
against the page images.

## Key claims

- The aim is to protect users from changes in how data is stored. "Future users of large data banks must be protected from having to know how the data is organized in the machine (the internal representation)." (abstract)
- Three kinds of dependence in existing systems: on ordering, indexing and access paths. "Three of the principal kinds of data dependencies which still need to be removed are: ordering dependence, indexing dependence, and access path dependence." (1.2)
- An index is only there for performance and is redundant information; programs shouldn't depend on it. "From an informational standpoint, an index is a redundant component of the data representation." (1.2.2)
- Programs written against a tree structure fail when the structure changes. "Since, in general, it is not practical to develop application programs which test for all tree structurings permitted by the system, these programs fail when a change in structure becomes necessary." (1.2.3)
- "Relation" is meant in the mathematical sense, a set of n-tuples, not a relationship between things. "The term relation is used here in its accepted mathematical sense." (1.3)
- In the array (table) view, row order doesn't matter and rows are distinct. "(2) The ordering of rows is immaterial. (3) All rows are distinct." (1.3)
- A primary key is a column or set of columns whose values identify each row. "Such a domain (or combination) is called a primary key." (1.3)
- A foreign key holds values of another relation's primary key, possibly its own. "We shall call a domain (or domain combination) of relation R a foreign key if it is not the primary key of R but its elements are values of the primary key of some relation S (the possibility that S and R are identical is not excluded)." (1.3)
- Normalization removes nested (nonsimple) domains by copying the parent's key down into child relations. "There is, in fact, a very simple elimination procedure, which we shall call normalization." (1.4)
- A normalized relation can be stored as a plain two-dimensional array. "A relation whose domains are all simple can be represented in storage by a two-dimensional column-homogeneous array of the kind discussed above." (1.4)
- The query language should be based on predicate calculus and describe which data, not how to get it. "The universality of the data sublanguage lies in its descriptive ability (not its computing ability)." (1.5)
- Redundant stored copies trade space and update time for query time. "then, generally speaking, extra storage space and update time are consumed with a potential drop in query time for some queries and in load on the central processing units." (2.2.1)
- Example of redundancy: storing a manager's name next to the manager's number, when it can be derived. "In this case the redundancy is obvious: the domain managername is unnecessary." (2.2.1)
- Checking consistency on every change slows writes. "Naturally, such checking will slow these operations down." (2.3)
- Written at IBM Research Laboratory, San Jose (author affiliation on the first page). "IBM Research Laboratory, San Jose, California" (page 1 header)
- A program written for one of the five parts/projects tree structures fails on at least three of the others. "If a program P is developed for this problem assuming one of the five structures above-that is, P makes no test to determine which structure is in effect-then P will fail on at least three of the remaining structures." (1.2.3)
- Programs that use indexing chains refer to them by name and break when they are removed. "Application programs taking advantage of the performance benefit of these indexing chains must refer to those chains by name. Such programs do not operate correctly if these chains are later removed." (1.2.2)
- Programs that rely on stored ordering break when it changes. "Those application programs which take advantage of the stored ordering of a file are likely to fail to operate correctly if for some reason it becomes necessary to replace that ordering by a different one." (1.2.1)
- Using any combination of a relation's columns as knowns is what Codd calls symmetric exploitation. "This is a system feature (missing from many current information systems) which we shall call (logically) symmetric exploitation of relations." (1.6)

## Visuals worth redrawing

- Figure 3(a)/(b): an unnormalized employee relation with nested job
  history, salary history and children, and its normalized form with
  the keys copied down.
- Structures 1-5: the same parts/projects data as five different trees.

## My notes

- Codd's "normal form" here is what's later called first normal form;
  2NF and 3NF came in later papers (see kent-five-normal-forms-1983).
- CACM 1970; the CMU notes date the IBM research proposal to 1969.
