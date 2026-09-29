---
id: kafka-design-delivery-semantics
title: Kafka design, Message Delivery Semantics and Using Transactions (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/design/design/
kind: docs
primary: true
---

## Summary

The Kafka 4.3 design docs' sections on delivery guarantees. Defines at
most once, at least once and exactly once; splits the problem into
the producer's side and the consumer's side; shows how the order of
"save position" and "process" decides between at most once and at
least once; and explains how the idempotent producer and transactions
(since 0.11.0.0) give exactly once for read-process-write inside
Kafka.

The same page's Persistence, Efficiency and Log Compaction sections
are used too (claims marked with their section): the page-cache design,
sendfile, and how compaction keeps the last value per key.

## Key claims

- The three guarantees. "At most once –Messages may be lost but are never redelivered." / "At least once –Messages are never lost but may be redelivered." / "Exactly once –Each message is processed once and only once." (Message Delivery Semantics)
- Two separate problems: publishing and consuming. "It’s worth noting that this breaks down into two problems: the durability guarantees for publishing a message and the guarantees when consuming a message." (Message Delivery Semantics)
- Read the fine print on exactly-once claims. "Many systems claim to provide “exactly-once” delivery semantics, but it is important to read the fine print, because sometimes these claims are misleading" (Message Delivery Semantics)
- A producer that gets a network error can't tell whether the write happened. "If a producer attempts to publish a message and experiences a network error, it cannot be sure if this error happened before or after the message was committed." (Message Delivery Semantics)
- Before 0.11.0.0, resending gave at least once. "This provides at-least-once delivery semantics since the message may be written to the log again during resending if the original request had in fact succeeded." (Message Delivery Semantics)
- The idempotent producer: a producer ID plus a sequence number per message lets the broker drop duplicates. "To achieve this, the broker assigns each producer an ID and deduplicates messages using a sequence number that is sent by the producer along with every message." (Message Delivery Semantics)
- Save position, then process: a crash in between loses messages, which is at most once. "This corresponds to “at-most-once” semantics as in the case of a consumer failure messages may not be processed." (Message Delivery Semantics, option 1)
- Process, then save position: a crash in between reprocesses messages, which is at least once. "This corresponds to the “at-least-once” semantics in the case of consumer failure." (Message Delivery Semantics, option 2)
- Keyed updates make redelivery harmless. "In many cases messages have a primary key and so the updates are idempotent (receiving the same message twice just overwrites a record with another copy of itself)." (Message Delivery Semantics)
- Exactly once inside Kafka: write the consumer's offset in the same transaction as the output. "The consumer’s position is stored as a message in an internal topic, so we can write the offset to Kafka in the same transaction as the output topics receiving the processed data." (Message Delivery Semantics)
- For external systems, store the offset in the same place as the output instead of two-phase commit. "This can be handled more simply and generally by letting the consumer store its offset in the same place as its output." (Message Delivery Semantics)
- Exactly once to other systems needs their cooperation; the default is at least once. "Exactly-once delivery for other destination systems generally requires cooperation with such systems" / "Otherwise, Kafka guarantees at-least-once delivery by default" (Message Delivery Semantics)
- At most once is configured by disabling producer retries and committing offsets before processing. "allows the user to implement at-most-once delivery by disabling retries on the producer and committing offsets in the consumer prior to processing a batch of messages." (Message Delivery Semantics)
- The fine print that exactly-once claims often miss: failing producers or consumers, several consumers, lost disk data. "they don’t translate to the case where consumers or producers can fail, cases where there are multiple consumer processes, or cases where data written to disk can be lost" (Message Delivery Semantics)
- The idempotent producer arrived in 0.11.0.0. "Since 0.11.0.0, the Kafka producer also supports an idempotent delivery option which guarantees that resending will not result in duplicate entries in the log." (Message Delivery Semantics)
- Why not two-phase commit: many output systems don't support it. "many of the output systems a consumer might want to write to will not support a two-phase commit." (Message Delivery Semantics)
- Only the producer is transactional; it updates the consumer's committed offset. "In Kafka, the consumer and producer are separate, and it is only the producer which is transactional." (Using Transactions)
- A transactional.id makes a restarted instance abort the old instance's open transaction. "also makes sure that a restarted application causes any in-flight transaction from the previous instance to abort." (Using Transactions)

- (Persistence) Kafka leans on the OS page cache instead of its own in-memory cache. "All data is immediately written to a persistent log on the filesystem without necessarily flushing to disk. In effect this just means that it is transferred into the kernel’s pagecache." (Persistence, Don't fear the filesystem)
- (Persistence) Appending to and reading files is O(1) and doesn't slow down as data grows. "This structure has the advantage that all operations are O(1) and reads do not block writes or each other." (Persistence, Constant Time Suffices)
- (Persistence) Cheap disk space lets Kafka keep messages after they're read. "instead of attempting to delete messages as soon as they are consumed, we can retain messages for a relatively long period (say a week)." (Persistence, Constant Time Suffices)
- (Efficiency) The two main costs once disk access is sequential. "there are two common causes of inefficiency in this type of system: too many small I/O operations, and excessive byte copying." (Efficiency)
- (Efficiency) One binary format shared by producer, broker and consumer, so chunks move without change. "we employ a standardized binary message format that is shared by the producer, the broker, and the consumer (so data chunks can be transferred without modification between them)." (Efficiency)
- (Efficiency) The broker's log is a directory of files in that same format. "The message log maintained by the broker is itself just a directory of files, each populated by a sequence of message sets that have been written to disk in the same format used by the producer and consumer." (Efficiency)
- (Efficiency) The read-then-write path: four copies and two system calls. "This is clearly inefficient, there are four copies and two system calls." (Efficiency; the four steps are listed just before)
- (Efficiency) sendfile leaves only the copy to the NIC. "Using sendfile, this re-copying is avoided by allowing the OS to send the data from pagecache to the network directly. So in this optimized path, only the final copy to the NIC buffer is needed." (Efficiency)
- (Efficiency) With many consumers, data enters the page cache once and is reused. "data is copied into pagecache exactly once and reused on each consumption instead of being stored in memory and copied out to user-space every time it is read." (Efficiency)
- (Efficiency) Caught-up consumers cause no disk reads. "on a Kafka cluster where the consumers are mostly caught up you will see no read activity on the disks whatsoever as they will be serving data entirely from cache." (Efficiency)
- (Efficiency) No sendfile with TLS in Kafka. "Due to this restriction, sendfile is not used when SSL is enabled." (Efficiency)
- (Efficiency) Batches stay compressed on disk and on the way to consumers. "This batch of messages is then written to disk in compressed form. The batch will remain compressed in the log and it will also be transmitted to the consumer in compressed form." (End-to-end Batch Compression)
- (Log Compaction) What it guarantees. "Log compaction ensures that Kafka will always retain at least the last known value for each message key within the log of data for a single topic partition." (Log Compaction)
- (Log Compaction) Time-based retention can't rebuild current state; a full log grows without bound. "This hypothetical complete log is not very practical for systems that update a single record many times as the log will grow without bound even for a stable dataset." (Log Compaction)
- (Log Compaction) Set per topic. "This retention policy can be set per-topic, so a single cluster can have some topics where retention is enforced by size or time and other topics where retention is enforced by compaction." (Log Compaction)
- (Log Compaction) The head keeps every message; compaction works on the tail. "The head of the log is identical to a traditional Kafka log. It has dense, sequential offsets and retains all messages. Log compaction adds an option for handling the tail of the log." (Log Compaction Basics)
- (Log Compaction) Offsets never change; a missing offset reads as the next one. "Note also that all offsets remain valid positions in the log, even if the message with that offset has been compacted away; in this case this position is indistinguishable from the next highest offset that does appear in the log." (Log Compaction Basics)
- (Log Compaction) A null value is a delete (tombstone), and tombstones are later removed too. "A message with a key and a null payload will be treated as a delete from the log. Such a record is sometimes referred to as a tombstone." (Log Compaction Basics)
- (Log Compaction) Cleaning recopies segments in the background and can be throttled. "The compaction is done in the background by periodically recopying log segments. Cleaning does not block reads and can be throttled to use no more than a configurable amount of I/O throughput to avoid impacting producers and consumers." (Log Compaction Basics)
- (Log Compaction) Order is kept. "Ordering of messages is always maintained. Compaction will never re-order messages, just remove some." (What guarantees does log compaction provide?)
- (Log Compaction) A consumer that lags past delete.retention.ms can miss tombstones. "it is possible for a consumer to miss delete markers if it lags by more than delete.retention.ms." (What guarantees does log compaction provide?)
- (Log Compaction) The cleaner's steps. "It chooses the log that has the highest ratio of log head to log tail" / "It creates a succinct summary of the last offset for each key in the head of the log" (Log Compaction Details)
- (Log Compaction) Extra space needed is one segment. "New, clean segments are swapped into the log immediately so the additional disk space required is just one additional log segment (not a full copy of the log)." (Log Compaction Details)
- (Log Compaction) 24 bytes per entry in the cleaner's map; 8 GB of buffer cleans about 366 GB of head, assuming 1 kB messages. "It uses exactly 24 bytes per entry. As a result with 8GB of cleaner buffer one cleaner iteration can clean around 366GB of log head (assuming 1kB messages)." (Log Compaction Details)
- (Log Compaction) The active segment is never compacted. "The active segment will not be compacted even if all of its messages are older than the minimum compaction time lag." (Configuring The Log Cleaner)
- (Log Compaction) max.compaction.lag.ms isn't a hard deadline. "Note that this compaction deadline is not a hard guarantee since it is still subjected to the availability of log cleaner threads and the actual compaction time." (Configuring The Log Cleaner)
- (Motivation) Kafka is closer to a database log than to a messaging system. "Supporting these uses led us to a design with a number of unique elements, more akin to a database log than a traditional messaging system." (Motivation)
- (Constant Time Suffices) Traditional brokers keep a per-consumer queue plus a B-tree. "The persistent data structure used in messaging systems are often a per-consumer queue with an associated BTree or other general-purpose random access data structures to maintain metadata about messages." (Constant Time Suffices)
- (The Producer) Producers write straight to the partition leader. "The producer sends data directly to the broker that is the leader for the partition without any intervening routing tier." (Load balancing)
- (The Producer) Any node answers metadata requests. "all Kafka nodes can answer a request for metadata about which servers are alive and where the leaders for the partitions of a topic are at any given time" (Load balancing)
- (The Producer) A key is hashed to a partition. "We expose the interface for semantic partitioning by allowing the user to specify a key to partition by and using this to hash to a partition" (Load balancing)
- (The Producer) Keying by user keeps a user in one partition. "For example if the key chosen was a user id then all data for a given user would be sent to the same partition." (Load balancing)
- (The Producer) Batching in the producer. "Batching is one of the big drivers of efficiency, and to enable batching the Kafka producer will attempt to accumulate data in memory and to send out larger batches in a single request." (Asynchronous send)
- (The Consumer) A fetch names an offset. "The consumer specifies its offset in the log with each request and receives back a chunk of log beginning from that position." (The Consumer)
- (The Consumer) Pull lets a slow consumer fall behind instead of being flooded. "A pull-based system has the nicer property that the consumer simply falls behind and catches up when it can." (Push vs. pull)
- (The Consumer) Long polling avoids busy-waiting. "To avoid this we have parameters in our pull request that allow the consumer request to block in a “long poll” waiting until data arrives" (Push vs. pull)
- (Consumer Position) Most brokers track consumption themselves. "Most messaging systems keep metadata about what messages have been consumed on the broker." (Consumer Position)
- (Consumer Position) Acks bring duplicates. "First of all, if the consumer processes the message but fails before it can send an acknowledgement then the message will be consumed twice." (Consumer Position)
- (Consumer Position) And per-message state on the broker. "now the broker must keep multiple states about every single message (first to lock it so it is not given out a second time, and then to mark it as permanently consumed so that it can be removed)." (Consumer Position)
- (Consumer Position) One consumer per partition per group. "Our topic is divided into a set of totally ordered partitions, each of which is consumed by exactly one consumer within each subscribing consumer group at any given time." (Consumer Position)
- (Consumer Position) Position is one integer. "This means that the position of a consumer in each partition is just a single integer, the offset of the next message to consume." (Consumer Position)
- (Consumer Position) Rewinding breaks the queue contract on purpose. "A consumer can deliberately rewind back to an old offset and re-consume data. This violates the common contract of a queue, but turns out to be an essential feature for many consumers." (Consumer Position)
- (The Share Consumer) Share groups can have more consumers than partitions. "The number of consumers in a share group can exceed the number of partitions in a topic." (The Share Consumer)
- (The Share Consumer) Per-record acks. "Records are acknowledged individually, though the system is optimized for batch processing to improve efficiency." (The Share Consumer)
- (The Share Consumer) A lock with a timeout, 30 s by default. "By default, the lock duration is 30 seconds, but you can control it using the group configuration parameter share.record.lock.duration.ms." (The Share Consumer)
- (Replication) Unreplicated is replication factor one. "in fact we implement un-replicated topics as replicated topics where the replication factor is one." (Replication)
- (Replication) The partition is the unit. "The unit of replication is the topic partition." (Replication)
- (Replication) One leader, some followers. "Under non-failure conditions, each partition in Kafka has a single leader and zero or more followers." (Replication)
- (Replication) Writes go to the leader. "All writes go to the leader of the partition, and reads can go to the leader or the followers of the partition." (Replication)
- (Replication) Leaders spread over brokers. "Typically, there are many more partitions than brokers and the leaders are evenly distributed among brokers." (Replication)
- (Replication) Followers fetch like consumers. "Followers consume messages from the leader just as a normal Kafka consumer would and apply them to their own log." (Replication)
- (Replication) The controller registers brokers. "In Kafka, a special node known as the “controller” is responsible for managing the registration of brokers in the cluster." (Replication)
- (Replication) Consumers only see committed messages. "Only committed messages are ever given out to the consumer." (Replication)
- (Replication) The durability promise. "The guarantee that Kafka offers is that a committed message will not be lost, as long as there is at least one in sync replica alive, at all times." (Replication)
- (Replication) Not always available under network partitions. "Kafka will remain available in the presence of node failures after a short fail-over period, but may not remain available in the presence of network partitions." (Availability and Durability Guarantees)
- (Replica Management) The controller picks new leaders. "If the controller detects the failure of a broker, it is responsible for electing one of the remaining members of the ISR to serve as the new leader." (Replica Management)
- (Consumer Position) Each partition is read by exactly one consumer per group, so the position is one integer. "This means that the position of a consumer in each partition is just a single integer, the offset of the next message to consume." (The Consumer, Consumer Position)
- (Consumer Position) That makes acknowledgement cheap. "This state can be periodically checkpointed. This makes the equivalent of message acknowledgements very cheap." (The Consumer, Consumer Position)
- (Consumer Position) Per-message acks on a broker lose or duplicate on failure, and cost state per message. "First of all, if the consumer processes the message but fails before it can send an acknowledgement then the message will be consumed twice." (The Consumer, Consumer Position)
- (Consumer Position) You can rewind and reread, e.g. after fixing a bug. "For example, if the consumer code has a bug and is discovered after some messages are consumed, the consumer can re-consume those messages once the bug is fixed." (The Consumer, Consumer Position)
- (The Consumer) Pull means a slow consumer just falls behind and catches up. "A pull-based system has the nicer property that the consumer simply falls behind and catches up when it can." (The Consumer, Push vs. pull)
- (Static Membership) Dynamic member ids change on restart, so deploys shuffle partitions; static ids avoid the rebalance. "Group membership remains unchanged based on those ids, thus no rebalance will be triggered." (Static Membership)
- (Static Membership) Duplicate static ids are fenced. "If you accidentally configure duplicate ids for different instances, a fencing mechanism on broker side will inform your duplicate client to shutdown immediately by triggering a org.apache.kafka.common.errors.FencedInstanceIdException." (Static Membership)
- (Message Delivery Semantics) After an aborted transaction the committed offset reverts, but the consumer doesn't rewind by itself. "If the transaction is aborted, the consumer’s stored position will revert to its old value (although the consumer has to refetch the committed offset because it does not automatically rewind)" (Message Delivery Semantics)
- (Message Delivery Semantics) read_uncommitted is the default and shows aborted records. "In the default “read_uncommitted” isolation level, all messages are visible to consumers even if they were part of an aborted transaction" (Message Delivery Semantics)
- (Using Transactions) The three parts of exactly-once with the plain clients: one consumer per partition via assignment, transactions for output and offsets, one producer per consumer. "The consumer uses partition assignment to ensure that it is the only consumer in the consumer group currently processing each partition." (Using Transactions)
- (Using Transactions) Required settings. "The consumer configuration must include isolation.level=read_committed and enable.auto.commit=false." (Using Transactions)
- (Using Transactions) On abort, reset the consumer's position yourself. "However, in the event of a transaction abort, the application’s state and in particular the current position of the consumer must be reset explicitly so that it can reprocess the records processed by the aborted transaction." (Using Transactions)
- (Using Transactions) The simple recovery: throw away producer and consumer and start again from the committed offset. "A simple policy for handling exceptions and aborted transactions is to discard and recreate the Kafka producer and consumer objects and start afresh." (Using Transactions)
- (Using Transactions) Kafka Streams is the easiest route to exactly-once. "As mentioned above, the simplest way to get exactly-once semantics from Kafka is to use Kafka Streams." (Using Transactions)
- (The Share Consumer) Share groups: many consumers per partition, per-record acks, counted delivery attempts. "Delivery attempts to consumers in a share group are counted, which enables automated handling of unprocessable records." (The Share Consumer)
- (The Share Consumer) A share consumer can reject a record as unprocessable. "Reject the record, indicating it’s unprocessable and preventing further delivery attempts for that record." (The Share Consumer)
- (Replication) Followers' logs are identical to the leader's. "The logs on the followers are identical to the leader’s log–all have the same offsets and messages in the same order" (Replication)
- (Replication) Pulling lets followers batch. "Having the followers pull from the leader has the nice property of allowing the follower to naturally batch together log entries they are applying to their log." (Replication)
- (Replication) In sync means a live session with the controller and not too far behind. "Brokers acting as followers must replicate the writes from the leader and not fall “too far” behind." (Replication)
- (Replication) The first liveness condition is a session with the controller. "Brokers must maintain an active session with the controller in order to receive regular metadata updates." (Replication)
- (Replication) What acks=0 and acks=1 commit. "the message is committed asynchronously across the set of in-sync replicas if acks=0 , or synchronously only on the leader if acks=1 ." (Availability and Durability Guarantees)
- (Replication) The leader tracks the ISR. "The leader keeps track of the set of “in sync” replicas, which is known as the ISR." (Replication)
- (Replication) A follower that can't reach the end of the leader's log within replica.lag.time.max.ms is dropped. "Replicas that cannot catch up to the end of the log on the leader within the max time set by this configuration are removed from the ISR." (Replication)
- (Replication) Fail/recover faults only, not Byzantine. "Kafka does not handle so-called “Byzantine” failures in which nodes produce arbitrary or malicious responses (perhaps due to bugs or foul play)." (Replication)
- (Replication) Visible to consumers only once on all in-sync replicas and the ISR is at least min.insync.replicas. "The messages are replicated to all the in-sync replicas." / "The number of the in-sync replicas is no less than the min.insync.replicas setting." (Replication)
- (Replicated Logs) The simplest replicated log: a leader picks the order. "There are many ways to implement this, but the simplest and fastest is with a leader who chooses the ordering of values provided to it." (Replicated Logs: Quorums, ISRs, and State Machines)
- (Replicated Logs) The core promise of log replication. "The fundamental guarantee a log replication algorithm must provide is that if we tell the client a message is committed, and the leader fails, the new leader we elect must also have that message." (Replicated Logs: Quorums, ISRs, and State Machines)
- (Replicated Logs) Majority vote: latency set by the fastest servers. "This majority vote approach has a very nice property: the latency is dependent on only the fastest servers." (Replicated Logs: Quorums, ISRs, and State Machines)
- (Replicated Logs) Majority needs three copies for one failure, five for two. "To tolerate one failure requires three copies of the data, and to tolerate two failures requires five copies of the data." (Replicated Logs: Quorums, ISRs, and State Machines)
- (Replicated Logs) Why not majority for Kafka: five copies cost too much disk and throughput for large data. "doing every write five times, with 5x the disk space requirements and 1/5th the throughput, is not very practical for large volume data problems." (Replicated Logs: Quorums, ISRs, and State Machines)
- (Replicated Logs) ISR: committed once every in-sync replica has it; only ISR members can lead. "A write to a Kafka partition is not considered committed until all in-sync replicas have received the write." (Replicated Logs: Quorums, ISRs, and State Machines)
- (Replicated Logs) f+1 replicas survive f failures. "With this ISR model and f+1 replicas, a Kafka topic can tolerate f failures without losing committed messages." (Replicated Logs: Quorums, ISRs, and State Machines)
- (Replicated Logs) Majority's edge: commit without the slowest. "The ability to commit without the slowest servers is an advantage of the majority vote approach." (Replicated Logs: Quorums, ISRs, and State Machines)
- (Replicated Logs) No fsync per write; a rejoining replica fully re-syncs. "Our protocol for allowing a replica to rejoin the ISR ensures that before rejoining, it must fully re-sync again even if it lost unflushed data in its crash." (Replicated Logs: Quorums, ISRs, and State Machines)
- (Unclean leader election) Off by default since 0.11.0.0. "By default from version 0.11.0.0, Kafka chooses the first strategy and favor waiting for a consistent replica." (Unclean leader election: What if they all die?)
- (Unclean leader election) The two choices when all ISR members die: wait for one, or take the first replica back. "Choose the first replica (not necessarily in the ISR) that comes back to life as the leader." (Unclean leader election: What if they all die?)
- (Availability and Durability Guarantees) acks=all means the current ISR. "By default, when acks=all, acknowledgement happens as soon as all the current in-sync replicas have received the message." (Availability and Durability Guarantees)
- (Availability and Durability Guarantees) Two replicas, one down: acks=all writes live on one copy. "However, these writes could be lost if the remaining replica also fails." (Availability and Durability Guarantees)
- (Availability and Durability Guarantees) min.insync.replicas only applies with acks=all. "This setting only takes effect if the producer uses acks=all and guarantees that the message will be acknowledged by at least this many in-sync replicas." (Availability and Durability Guarantees)
- (The Producer) Batching trades latency for throughput. "This buffering is configurable and gives a mechanism to trade off a small amount of additional latency for better throughput." (Asynchronous send)
- (Replication) Follower logs match the leader's. "The logs on the followers are identical to the leader’s log–all have the same offsets and messages in the same order (though, of course, at any given time the leader may have a few as-yet unreplicated messages at the end of its log)." (Replication)
- (Replication) Consumers see a message only once all in-sync replicas have it (and there are at least min.insync.replicas of them). "Regardless of the acks setting, the messages will not be visible to the consumers until all the following conditions are met:" / "The messages are replicated to all the in-sync replicas." (Replication)
- (Consumer Position) Unacked messages are a known headache for broker-tracked acks. "Tricky problems must be dealt with, like what to do with messages that are sent but never acknowledged." (The Consumer, Consumer Position)
- (Push vs. pull) Pull batches well. "Another advantage of a pull-based system is that it lends itself to aggressive batching of data sent to the consumer." (The Consumer, Push vs. pull)
- (Log Compaction) Uses: reloading a cache or restoring a search node, event sourcing, and journaling local state for failover. "But if you want to be able to reload the cache or restore a failed search node you may need a complete data set." / "A process that does local computation can be made fault-tolerant by logging out changes that it makes to its local state so another process can reload these changes and carry on if it should fail." (Log Compaction)
- (Log Compaction) A caught-up consumer sees everything. "Any consumer that stays caught-up to within the head of the log will see every message that is written; these messages will have sequential offsets." (What guarantees does log compaction provide?)
- (Log Compaction) The recopy step and the map. "It recopies the log from beginning to end removing keys which have a later occurrence in the log." / "The summary of the log head is essentially just a space-compact hash table." (Log Compaction Details)
- (Efficiency) Why no sendfile with TLS: the TLS library runs in user space. "TLS/SSL libraries operate at the user space (in-kernel SSL_sendfile is currently not supported by Kafka)." (Efficiency)
- (The Share Consumer) Release puts a record back for another attempt. "Release the record, making it available for another delivery attempt." (The Share Consumer)
- (The Share Consumer) Renew extends the lock while work continues. "Renew the record, extending the delivery attempt because the record is still being processed." (The Share Consumer)
- (The Share Consumer) A cap on acquired records per partition keeps delivery moving past failed consumers. "By limiting the duration of the acquisition lock and automatically releasing the locks, the broker ensures delivery progresses even in the presence of consumer failures." (The Share Consumer)
- (The Share Consumer) Several share groups read one topic independently. "If a topic is accessed by consumers in multiple share groups, each share group consumes from that topic independently of the others." (The Share Consumer)

## Visuals worth redrawing

- (Log Compaction) The page has pictures of a log with a compacted tail
  and of cleaning a segment; only the text around them was read. The
  article's figure is drawn from the text's own example.
- (Efficiency) The four-copy read/write path against the sendfile path
  (described in text, not drawn on the page). Our own drawing.

- The two consumer orders (commit then process, process then commit)
  with the crash point marked in each. Our own drawing.

## My notes

- Share groups (newer) count delivery attempts and let a consumer
  reject a record; relevant to the dead-letter-queue node, not here.
