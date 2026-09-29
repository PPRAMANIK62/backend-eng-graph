---
id: kafka-consumer-configs
title: Consumer and Share Consumer Configs (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/configuration/consumer-configs/
kind: docs
primary: true
---

## Summary

The reference list of consumer settings for Kafka 4.3, with defaults.
Used for the group protocol switch, commit settings, where to start
with no committed offset, failure detection timeouts, assignors and
isolation level.

## Key claims

- Two group protocols; classic is still the default in 4.3. "The group protocol that the consumer uses. The supported values are classic or consumer. The default value is classic." (group.protocol)
- enable.auto.commit defaults to true and commits in the background. "If true the consumer's offset will be periodically committed in the background." (enable.auto.commit; Default: true)
- Auto commit runs every 5 seconds by default. (auto.commit.interval.ms; "Default: 5000 (5 seconds)")
- auto.offset.reset decides where to start with no committed offset, or when the committed one has been deleted. "What to do when there is no initial offset in Kafka or if the current offset does not exist any more on the server (e.g. because that data has been deleted)" (auto.offset.reset)
- Options are earliest, latest, by_duration and none. "earliest: automatically reset the offset to the earliest offset" / "latest: automatically reset the offset to the latest offset" (auto.offset.reset)
- latest plus adding partitions can lose messages. "Note that altering partition numbers while setting this config to latest may cause message delivery loss since producers could start to send messages to newly added partitions (i.e. no initial offsets exist yet) before consumers reset their offsets." (auto.offset.reset)
- session.timeout.ms: no heartbeat in time, the broker removes the member and rebalances; 45 seconds by default; not used with the consumer protocol. "If no heartbeats are received by the broker before the expiration of this session timeout, then the broker will remove this client from the group and initiate a rebalance." (session.timeout.ms; Default: 45000 (45 seconds))
- With group.protocol=consumer, the session timeout is a broker setting. "In that case, session timeout is controlled by the broker config group.consumer.session.timeout.ms." (session.timeout.ms)
- max.poll.interval.ms: 5 minutes by default; missing it marks the consumer failed. "If poll() is not called before expiration of this timeout, then the consumer is considered failed and the group will rebalance in order to reassign the partitions to another member." (max.poll.interval.ms; Default: 300000 (5 minutes))
- max.poll.records defaults to 500. (max.poll.records; "Default: 500")
- Default assignors: Range, with CooperativeSticky available by rolling bounce. "The default assignor is [RangeAssignor, CooperativeStickyAssignor], which will use the RangeAssignor by default, but allows upgrading to the CooperativeStickyAssignor with just a single rolling bounce that removes the RangeAssignor from the list." (partition.assignment.strategy)
- StickyAssignor keeps as many existing assignments as possible. "Guarantees an assignment that is maximally balanced while preserving as many existing partition assignments as possible." (partition.assignment.strategy)
- group.instance.id makes a consumer a static member, to avoid rebalances on restarts. "This can be used in combination with a larger session timeout to avoid group rebalances caused by transient unavailability (e.g. process restarts)." (group.instance.id)
- With the consumer protocol, assignment runs on the server. "The name of the server-side assignor to use." (group.remote.assignor)
- isolation.level defaults to read_uncommitted, which returns aborted transactional messages too. "If set to read_uncommitted (the default), consumer.poll() will return all messages, even transactional messages which have been aborted." (isolation.level)
- read_committed consumers can't read up to the high watermark while transactions are open. "As a result, read_committed consumers will not be able to read up to the high watermark when there are in flight transactions." (isolation.level)
- A static member is unique in its group. "If set, the consumer is treated as a static member, which means that only one instance with this ID is allowed in the consumer group at any time." (group.instance.id)
- The other two reset options. "by_duration:<duration>: automatically reset the offset to a configured <duration> from the current timestamp." / "none: throw exception to the consumer if no previous offset is found for the consumer's group" (auto.offset.reset)

## Visuals worth redrawing

None.

## My notes

- Defaults are for Kafka 4.3. Check again when a new major version ships.
