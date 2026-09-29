---
id: aws-dynamodb-nosql-design
title: "NoSQL design for DynamoDB"
author: Amazon Web Services
url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html
kind: docs
primary: true
---

## Summary

The DynamoDB Developer Guide's page on how designing for a key-value /
document store differs from relational design: know the access patterns
first, shape data to match the queries, keep related items together
under one key, and use sort order.

## Key claims

- Relational: flexible queries. DynamoDB: a few efficient ones. "In a NoSQL database such as DynamoDB, data can be queried efficiently in a limited number of ways, outside of which queries can be expensive and slow." (Differences between relational data design and NoSQL)
- Relational design doesn't depend on queries; normalization does. "In RDBMS, you design for flexibility without worrying about implementation details or performance. Query optimization generally doesn't affect schema design, but normalization is important." (Differences)
- DynamoDB schema is designed around the most important queries. "In DynamoDB, you design your schema specifically to make the most common and important queries as fast and as inexpensive as possible." (Differences)
- Know the questions first. "By contrast, you shouldn't start designing your schema for DynamoDB until you know the questions it will need to answer." (Two key concepts)
- As few tables as possible. "You should maintain as few tables as possible in a DynamoDB application." (Two key concepts)
- Data is stored in the shape it will be read. "Instead of reshaping data when a query is processed (as an RDBMS system does), a NoSQL database organizes data so that its shape in the database corresponds with what will be queried." (Approaching NoSQL design)
- Use sort order to group related items. "Related items can be grouped together and queried efficiently if their key design causes them to sort together." (Approaching NoSQL design)
- Spread keys to avoid hot spots. "Instead, you should design data keys to distribute traffic evenly across partitions as much as possible, avoiding hot spots." (Approaching NoSQL design)
- The vendor's view of relational queries. "In RDBMS, data can be queried flexibly, but queries are relatively expensive and don't scale well in high-traffic situations" (Differences)

## Visuals worth redrawing

None.

## My notes

- The claim that relational queries "don't scale well in high-traffic
  situations" is the vendor's framing; Stonebraker and Pavlo argue the
  opposite. That's the disagreement for `data-models`.
