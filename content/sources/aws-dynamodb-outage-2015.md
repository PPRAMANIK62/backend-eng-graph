---
id: aws-dynamodb-outage-2015
title: Summary of the Amazon DynamoDB Service Disruption and Related Impacts in the US-East Region
author: Amazon Web Services
url: https://aws.amazon.com/message/5467D2/
kind: blog
primary: true
---

## Summary

AWS's public post-event summary of a DynamoDB outage in US-East in 2015
(the year comes from Huang et al.'s Table 1, incident AWS3). A short
network disruption made storage servers re-request their "membership"
from a metadata service whose responses had grown large; requests timed
out, servers dropped out and retried, and the retries kept the metadata
service overloaded until AWS paused requests to it. A textbook metastable
failure, and the fix list includes splitting the metadata service into
many instances, each serving part of the fleet.

## Key claims

- Storage servers that can't get membership in time retry and take themselves out of service. "If the storage servers aren’t able to retrieve this membership data back within a specific time period, they will retry the membership request and temporarily disqualify themselves from accepting requests." (The DynamoDB Event)
- Membership responses had grown (new Global Secondary Indexes) until processing time neared the timeout. "the processing time inside the metadata service for some membership requests began to approach the retrieval time allowance by storage servers." (The DynamoDB Event)
- The growth wasn't monitored and capacity was short. "We did not have detailed enough monitoring for this dimension (membership size), and didn’t have enough capacity allocated to the metadata service to handle these much heavier requests." (The DynamoDB Event)
- Healthy servers doing routine checks then failed too, and retries kept load high. "Unavailable servers continued to retry requests for membership data, maintaining high load on the metadata service." (The DynamoDB Event)
- Error rate stabilized around 55%. "finally stabilizing at approximately 55%." (The DynamoDB Event)
- They couldn't add capacity because the service was too loaded to accept admin requests. "Initially, we were unable to add capacity to the metadata service because it was under such high load, preventing us from successfully making the requisite administrative requests." (The DynamoDB Event)
- Pausing requests cut retries and let it recover. "This action decreased retry activity, which relieved much of the load on the metadata service." (The DynamoDB Event)
- Fixes: more capacity, monitoring of membership size, fewer membership requests and a longer timeout. "Third, we are reducing the rate at which storage nodes request membership data and lengthening the time allowed to process queries." (The DynamoDB Event, closing paragraph)
- Longer term: many metadata service instances, each for part of the fleet. "we are segmenting the DynamoDB service so that it will have many instances of the metadata service each serving only portions of the storage server fleet." (The DynamoDB Event, closing paragraph)
- A console login call had a very long timeout that blocked login for tens of seconds. "It should have simply failed quickly and allowed progress on login to continue." (Impact on Other Services, Console)
- Storage servers check their membership periodically. "Storage servers hold the actual table data within a partition and need to periodically confirm that they have the correct membership." (Background)
- The trigger: after the network disruption, many servers asked at once. "So, when the network disruption occurred on Sunday morning, and a number of storage servers simultaneously requested their membership data, the metadata service was processing some membership lists that were now large enough that their processing time was near the time limit for retrieval." (The DynamoDB Event)

## Visuals worth redrawing

None.

## My notes

- Rendered with headless Chromium; the page text has the times of day but the year is only in Huang et al.
