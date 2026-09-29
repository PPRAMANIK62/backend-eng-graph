---
id: normalization
title: Normalization
depth: deep
phase: 6
note: >-
  Storing each fact once so it can't disagree with itself.
needs: [relational-model]
leads_to: [denormalization]
compare_with: [denormalization, star-schema]
---

# Normalization

Normalization is designing tables so that each fact is stored in one
place. If a warehouse's address lives in one row, it can't have two
different values; if it's copied into a thousand rows, it eventually
will. The normal forms are a checklist for spotting copies, and the
price you pay for removing them is joins when you read.

## One fact in many rows

Take an inventory table where each row says how many of a part a
warehouse holds, and, for convenience, the warehouse's address:

| part | warehouse | quantity | warehouse_address |
|---|---|---|---|
| bolt | W1 | 500 | 1 Dock Rd |
| nut | W1 | 900 | 1 Dock Rd |
| bolt | W2 | 200 | 7 Mill Ln |

The key is `(part, warehouse)`: together they pick one row. But the
address is a fact about the warehouse alone, not about the part in it.
That causes four problems, often called anomalies:

- **Repetition.** W1's address is stored once per part it holds.
- **Update anomaly.** When W1 moves, every one of its rows has to change.
- **Inconsistency.** Miss one row and W1 has two addresses. Which is
  right?
- **Insert and delete anomalies.** A new warehouse with no stock yet has
  no row to hold its address. Sell the last bolt in W2 and delete the
  row, and W2's address is gone too.

The fix is to split the table so the address lives with the thing it
describes:

![Before: one inventory table with columns part, warehouse, quantity and warehouse address, where W1's address "1 Dock Rd" is repeated on two rows and highlighted. After: an inventory table (part, warehouse, quantity) and a warehouses table (warehouse, address) with one row per warehouse. An arrow labelled foreign key links inventory.warehouse to warehouses.warehouse.](img/normalization-split.svg)

*Removing a partial dependency. Adapted from William Kent, "A Simple Guide to Five Normal Forms in Relational Database Theory" (1983), section 3.1.*

Now the address is stored once. To show a part with its warehouse
address you [[joins|join]] the two tables back together, which is the
trade normalization always makes: writes get simpler and safer, some
reads get more work.

## The normal forms, in plain terms

The normal forms were defined one after another through the 1970s,
starting with Codd's paper that introduced the [[relational-model]].
Each one names a kind of redundancy.

**First normal form (1NF): no repeating groups.** Every row of a table
has the same columns, and a column holds one value, not a list. A
`students` table with `class1`, `class2`, `class3` columns breaks it (what
about a fourth class?), and so does one column holding a nested list.
The fix is a separate table with one row per student per class. This is
the "normal form" of Codd's 1970 paper: he removed nested values by
moving them into their own table and copying the parent's key down.

**Second normal form (2NF): no facts about part of the key.** Only
matters when the key has several columns. The warehouse address above
depends on `warehouse`, which is only part of the key `(part,
warehouse)`.

**Third normal form (3NF): no facts about other non-key columns.** Take
`employees(employee, department, location)` where each department sits
in one place. `location` is a fact about the department, not the
employee. Moving departments means updating every employee row. Split
out `departments(department, location)`.

Put together, 2NF and 3NF say: every non-key column should be a fact
about the whole key, and nothing else.

The formal version of "a fact about" is a **functional dependency**:
column Y depends on column X if two rows with the same X can never have
different Y. Here `warehouse → warehouse_address` and `department →
location`. Normalizing means finding these dependencies and moving each
fact into a table where the thing it depends on is the key.

**Fourth and fifth normal forms** deal with many-to-many facts. Fourth
normal form says don't put two independent lists in one table: if an
employee has several skills and several languages, a single
`(employee, skill, language)` table forces you to invent pairings
between skills and languages that mean nothing. Use
`employee_skills` and `employee_languages`. Fifth normal form covers
rarer cases where a three-way table can be rebuilt exactly from smaller
two-way tables. You'll also see Boyce-Codd normal form (BCNF), which
was proposed between 3NF and 4NF; this article doesn't go into it.

## What normalization buys you

- **Each change happens in one row.** A customer's email, a product's
  price, a warehouse's address: update it once.
- **The data can't disagree with itself.** There's no second copy to
  drift.
- **Facts can exist on their own.** A department with no employees, a
  warehouse with no stock, still has a row.
- **The database can enforce it.** With the fact in one table,
  [[constraints]] like foreign keys and unique keys guard it for you.

The cost is on the read side. A query that used to read one row now
reads two or three tables and joins them. That's the whole reason
databases put so much work into [[joins]], and the reason
[[denormalization]] exists.

## Where it gets tricky

**How far to go is a judgement call.** The rules were written assuming
every non-key field changes often, so they favor writes and penalize
reads. Even the tutorials that teach them say you don't have to
normalize fully once real performance needs are weighed. A common rule
of thumb is that third normal form is enough for most applications, and
4NF and 5NF rarely come up in practice.

**Practitioners mostly don't normalize by the rules.** Normalization
theory largely failed in practice, for two reasons: it didn't say where the first
set of tables comes from, and functional dependencies were too hard for
most people to reason about. What won instead was drawing an
entity-relationship diagram (boxes for things, lines for relationships)
and converting it to tables, which a tool can do automatically and which
lands you in 3NF.

**Normalization doesn't remove every copy.** The normal forms look at
one table at a time. `employee_department`, `department_location` and
`employee_location` can each be in 3NF while the third table is plainly
derivable from the other two. Some repetition is also unavoidable when
facts depend on each other.

**Dependencies need real identifiers.** A functional dependency only
exists when each thing has one unique, consistently spelled
identifier. If the same person is stored as "John Smith" at two
addresses, or one address is spelled two ways, the formal rules find no
dependency, and the table can pass 3NF on paper while still having every
anomaly above. Stable keys ([[primary-keys]]) matter as much as the
table split.

**Sources muddle the higher forms.** You'll find tutorials, including
Microsoft's own Access docs, that say fourth normal form is another name
for BCNF. They're different forms, proposed in different papers.

**Lists in a column are back.** Modern databases let a column hold an
array or a JSON document ([[jsonb]]), which breaks 1NF on purpose. That
can be the right call for data you always read and write as a whole,
but anything inside it that other rows refer to has the same update
problems as the warehouse address.

## What this means when you build

- Start normalized: one table per kind of thing, each column a fact
  about that table's whole key.
- When you're about to copy a column into a second table, ask what
  keeps the copies in sync. If the answer is "we'll remember", don't.
- Declare foreign keys so the database enforces the links between the
  split tables.
- Denormalize later, on purpose, for a read path you've measured, and
  write down what keeps the copy correct.

## Further reading

- [A Simple Guide to Five Normal Forms in Relational Database Theory](https://www.bkent.net/Doc/simple5.htm), William Kent, 1983. The clearest short explanation of 1NF to 5NF, with the warehouse and employee examples and the limits of normalization.
- [A Relational Model of Data for Large Shared Data Banks](https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf), E. F. Codd, 1970. Where normalization started: removing nested values, and the cost of redundant stored data.
- [What Goes Around Comes Around](https://people.cs.umass.edu/~yanlei/courses/CS691LL-f06/papers/SH05.pdf), Michael Stonebraker and Joseph M. Hellerstein, 2005. The list of normal forms and why entity-relationship design beat normalization theory in practice.
- [Description of the database normalization basics](https://learn.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description), Microsoft. A beginner's walk through 1NF to 3NF with a student table, and when to stop.
- [Lecture #01: Relational Model & Algebra](https://15445.courses.cs.cmu.edu/fall2024/notes/01-relationalmodel.pdf), Andy Pavlo, CMU 15-445, 2024. Notes that values in modern relational databases can be lists and nested structures, not only atomic values.
- [Lecture #12: Join Algorithms](https://15445.courses.cs.cmu.edu/fall2024/notes/12-joins.pdf), Andy Pavlo, CMU 15-445, 2024. The first page ties normalization to joins: split to avoid repetition, join to put it back.
