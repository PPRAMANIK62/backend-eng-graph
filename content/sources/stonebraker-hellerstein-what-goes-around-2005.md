---
id: stonebraker-hellerstein-what-goes-around-2005
title: What Goes Around Comes Around
author: Michael Stonebraker, Joseph M. Hellerstein
url: https://people.cs.umass.edu/~yanlei/courses/CS691LL-f06/papers/SH05.pdf
kind: paper
primary: true
---

## Summary

A history of 35 years of data model proposals, written for the fourth
edition of the "Red Book" (Readings in Database Systems), 2005. It walks
through hierarchical (IMS), network (CODASYL), relational,
entity-relationship, extended relational, object and XML eras and pulls a
numbered lesson out of each. Stonebraker built INGRES and Postgres and
was in the room for the relational debate, so this is an insider's
account. Read from a copy hosted for a UMass course.

## Key claims

- Codd's work was driven by the maintenance cost of IMS programs when storage changed. "he indicated that the driver for his research was the fact that IMS programmers were spending large amounts of time doing maintenance on IMS applications, when logical or physical changes occurred." (IV Relational Era)
- Codd's proposal had three parts. "Store the data in a simple data structure (tables) Access it through a high level set-at-a-time DML No need for a physical storage proposal" (IV, a three-line list)
- The relational model is flexible enough to represent almost anything. "the relational model has the added advantage that it is flexible enough to represent almost anything." (IV)
- Record-at-a-time interfaces force manual query optimization. "Lesson 4: A record-at-a-time user interface forces the programmer to do manual query optimization, and this is often hard." (II)
- Codd's own languages were formal and hard for most people; SQL and QUEL were friendlier. "Codd is a mathematician, and his languages are not the right ones. SQL [CHAM74] and QUEL [STON76] are much more user friendly." (IV)
- System R and INGRES showed it could be implemented efficiently, and optimizers could compete with good programmers. "Moreover, query optimizers can be built that are competitive with all but the best programmers at constructing query plans." (IV)
- IBM's DB/2 announcement settled the debate and made SQL the de facto standard. "Second, they effectively declared that SQL was the de facto standard relational language." (IV)
- Lesson 7: set-at-a-time languages give physical data independence. "Lesson 7: Set-a-time languages are good, regardless of the data model, since they offer much improved physical data independence." (IV)
- Lesson 10: optimizers beat almost all hand-written access code. "Lesson 10: Query optimizers can beat all but the best record-at-a-time DBMS application programmers." (IV)
- The normal forms of the 1970s. "Throughout the decade of the 1970’s there were a collection of normal forms proposed, including second normal form (2NF) [CODD71b], third normal form [CODD71b], Boyce-Codd normal form (BCNF) [CODD72b], fourth normal form (4NF) [FAGI77a], and project-join normal form [FAGI77b]." (V Entity-Relationship Era)
- Normalization theory had no answer to where the first tables come from, and practitioners couldn't use functional dependencies. "Hence, data base design using normalization was “dead in the water”." (V)
- E-R diagrams won schema design because they convert to third normal form tables automatically. "In addition, it was straightforward to convert an E-R diagram into a collection of tables in third normal form [WONG79]." (V)
- Lesson 11. "Lesson 11: Functional dependencies are too difficult for mere mortals to understand." (V)
- Views give logical data independence. "Moreover, relational views [STON75] offer vastly enhanced logical data independence, relative to CODASYL." (IV)
- A tool could do the E-R to tables conversion. "Hence, a DBA tool could perform this conversion automatically." (V)
- The CODASYL side of "the great debate" argued programmers couldn't learn relational languages and it couldn't be implemented efficiently. "a) COBOL programmers cannot possibly understand the new-fangled relational languages b) It is impossible to implement the relational model efficiently" (IV, list of Bachman's side)
- IBM's 1984 announcement of DB/2 ended the debate. "This state of affairs changed abruptly in 1984, when IBM announced the upcoming release of DB/2 on MVS." (IV)

## Visuals worth redrawing

- Figure 7: Project Eagle, a relational front end over IMS (never shipped).

## My notes

- Section headings in the PDF are Roman numerals (II Hierarchical, III
  Network, IV Relational, V Entity-Relationship).
