---
id: kafka-basic-operations
title: Basic Kafka Operations (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/operations/basic-kafka-operations/
kind: docs
primary: true
---

## Summary

The operations chapter of the Kafka 4.3 docs. Used here for the
consumer group tool: checking each partition's committed offset, log
end offset and lag, listing members and their partitions, and
resetting a group's offsets.

## Key claims

- The kafka-consumer-groups.sh tool shows each consumer's position and how far behind the log end it is. "We have a tool that will show the position of all consumers in a consumer group as well as how far behind the end of the log they are." (Checking consumer position)
- Its output has one row per partition with CURRENT-OFFSET, LOG-END-OFFSET and LAG; in the first example partition 0 is at 2 with a log end of 4, lag 2. "TOPIC PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG CONSUMER-ID HOST CLIENT-ID" (Checking consumer position, example output)
- In the members example, one of four consumers (consumer3) has 0 partitions and no assignment. (Managing consumer groups, --members --verbose)
- The group's state shows the assignment strategy and member count, e.g. "range" and "Stable". (Managing consumer groups, --state)
- A group can be deleted by hand, or goes away when its last committed offset expires. "The consumer group can be deleted manually, or automatically when the last committed offset for that group expires." (Managing consumer groups)
- Offsets can be reset to earliest, latest, a time, a shift, or a specific offset; stop the consumers first. "Also, first make sure that the consumer instances are inactive." (Managing consumer groups, --reset-offsets)
- Reset options include moving by n offsets either way. "--shift-by <Long: number-of-offsets> : Reset offsets shifting current offset by 'n', where 'n' can be positive or negative." (Managing consumer groups)
- A partition lives on one server. "First each partition must fit entirely on a single server." (Adding and removing topics)
- The partition count caps consumer parallelism. "Finally the partition count impacts the maximum parallelism of your consumers." (Adding and removing topics)
- Each partition is a folder on disk. "Each sharded partition log is placed into its own folder under the Kafka log directory." (Adding and removing topics)
- Adding partitions moves keys (stated for hash(key) % number_of_partitions). "This means that messages with the same key may be routed to different partitions after the expansion, potentially affecting message ordering guarantees for existing keys." (Modifying topics, Key Distribution Changes)
- Old data stays where it is. "Kafka will not attempt to automatically redistribute existing data." (Modifying topics, Key Distribution Changes)
- You can't reduce the partition count. "Kafka does not currently support reducing the number of partitions for a topic." (Modifying topics)
- New leaders are elected when a broker dies. "The Kafka cluster will automatically detect any broker shutdown or failure and elect new leaders for the partitions on that machine." (Graceful shutdown)
- A restarted broker comes back as a follower only. "When the broker is restarted it will only be a follower for all its partitions, meaning it will not be used for client reads and writes." (Balancing leadership)
- The first replica in the list is the preferred leader. "If the list of replicas for a partition is 1,5,9 then node 1 is preferred as the leader to either node 5 or 9 because it is earlier in the replica list." (Balancing leadership)
- Replicas can be spread over racks. "The rack awareness feature spreads replicas of the same partition across different racks." (Balancing Replicas Across Racks)
- Leadership goes back to the preferred replica by default. "By default the Kafka cluster will try to restore leadership to the preferred replicas." (Balancing leadership)
- New partitions take time to appear in clients. "New partitions are not immediately visible to producers and consumers due to metadata refresh intervals" (Modifying topics, Metadata Propagation Delay)
- A topic's load spreads over at most as many servers as it has partitions. "So if you have 20 partitions the full data set (and read and write load) will be handled by no more than 20 servers (not counting replicas)." (Adding and removing topics)

## Visuals worth redrawing

None.

## My notes

- LAG in this tool is log end offset minus the committed offset.
  The client metric records-lag uses the consumer's current position
  instead (see kafka-monitoring).
