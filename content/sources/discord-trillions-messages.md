---
id: discord-trillions-messages
title: How Discord Stores Trillions of Messages
author: Bo Ingram (Discord)
url: https://discord.com/blog/how-discord-stores-trillions-of-messages
kind: blog
primary: true
---

## Summary

Discord's 2023 post on moving its messages database from Cassandra to
ScyllaDB. The part that matters here is the hot partition problem:
messages are partitioned by channel and time bucket, a few channels
get far more reads than others, and the node serving one busy
partition slowed the whole cluster. The fix they built first was
request coalescing in front of the database.

## Key claims

- Cluster size over time. "In 2017, we ran 12 Cassandra nodes, storing billions of messages. At the beginning of 2022, it had 177 nodes with trillions of messages." (Our Cassandra Troubles)
- The partition key is the channel plus a time bucket. "We partition our messages by the channel they’re sent in, along with a bucket, which is a static time window." (Our Cassandra Troubles)
- Channels differ hugely in traffic. "a server with just a small group of friends tends to send orders of magnitude fewer messages than a server with hundreds of thousands of people." (Our Cassandra Troubles)
- In Cassandra reads cost more than writes. "In Cassandra, reads are more expensive than writes." (Our Cassandra Troubles)
- Concurrent reads make a hot partition. "Lots of concurrent reads as users interact with servers can hotspot a partition, which we refer to imaginatively as a “hot partition”." (Our Cassandra Troubles)
- One hot partition slowed the whole cluster. "When we encountered a hot partition, it frequently affected latency across our entire database cluster." (Our Cassandra Troubles)
- Quorum reads and writes spread the damage to other queries. "Since we perform reads and writes with quorum consistency level, all queries to the nodes that serve the hot partition suffer latency increases, resulting in broader end-user impact." (Our Cassandra Troubles)
- Request coalescing: one database query for many identical requests. "If multiple users are requesting the same row at the same time, we’ll only query the database once." (Data Services Serving Data)
- The case it was built for: an @everyone announcement. "Previously, this might lead to a hot partition, and on-call would potentially need to be paged to help the system recover." (Data Services Serving Data)
- Requests are routed by consistent hash on channel ID so coalescing works. "For messages, this is a channel ID, so all requests for the same channel go to the same instance of the service." (Data Services Serving Data)
- It helped but didn't end the problem. "We’re still seeing hot partitions and increased latency on our Cassandra cluster, just not quite as frequently." (Data Services Serving Data)
- After the move: 72 ScyllaDB nodes instead of 177 Cassandra nodes. "we’re going from running 177 Cassandra nodes to just 72 ScyllaDB nodes." (Several Months Later)
- The announcement case in full. "Let’s imagine a big announcement on a large server that notifies @everyone: users are going to open the app and read the message, sending tons of traffic to the database." (Data Services Serving Data)
- Coalescing bought time for the migration. "It buys us some time so that we can prepare our new optimal cluster" (Data Services Serving Data)

## Visuals worth redrawing

None used.

## My notes

- The 2017 post "How Discord Stores Billions of Messages" (Stanislav
  Vishnevskiy) explains why the time bucket exists: partitions past
  100 MB, about 10 days of messages per bucket. Opened, not cited.
