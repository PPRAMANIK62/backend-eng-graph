---
id: marz-beat-cap-2011
title: How to beat the CAP theorem
author: Nathan Marz
url: http://nathanmarz.com/blog/how-to-beat-the-cap-theorem.html
kind: blog
primary: true
---

## Summary

The 2011 post by Storm's creator that laid out what later became known
as the Lambda Architecture (the word "Lambda" isn't in this post). Data
is a growing set of immutable facts; a batch layer on Hadoop recomputes
views from all of it, hours behind; a realtime layer (Storm writing to
Cassandra) covers only the last few hours; queries merge both. Mistakes
in the realtime layer are temporary because the next batch run
overwrites them.

## Key claims

- The whole field in one equation. "Query = Function(All Data)" (What is a data system?)
- Data is immutable; you only read and add. "This means that there are only two main operations you can do with data: read existing data and add more data." (Data)
- Batch layer: precompute everything, accept hours of staleness. "Whenever there's new data, you just recompute everything. This is feasible because we relaxed the problem to allow queries to be out of date by a few hours." (Batch computation)
- Human fault tolerance: a bug in a query is fixed by redeploying and recomputing. "all you have to do to fix things is fix the bug, deploy the fixed version, and recompute everything from the master dataset." (The batch system, CAP, and human fault-tolerance)
- The realtime layer only covers the last few hours. "The realtime system precomputes each query function for the last few hours of data." (Realtime layer)
- The realtime layer updates read/write stores incrementally. "The realtime layer is where you use read/write databases like Riak or Cassandra, and the realtime layer relies on incremental algorithms to update the state in those databases." (Realtime layer)
- Recovery took hours. "The batch layer ran like clockwork and within a few hours everything was back to normal." (Batch layer + realtime layer)
- Queries merge the two views. "To resolve a query function, you query the batch view and the realtime view and merge the results together to get the final answer." (Realtime layer)
- Realtime mistakes are overwritten by the batch layer. "everything the realtime layer computes is eventually overridden by the batch layer." (Batch layer + realtime layer)
- The realtime layer's complexity is transient. "All that complexity is transient." (same)
- Personal story: Cassandra ran out of space, messages replayed over and over; fixed by flushing queues to the batch layer and a fresh cluster, with no lost or wrong data. "No data was lost and there was no inaccuracy in our queries." (same)
- Exact in batch, approximate in realtime, which he calls eventual accuracy. "The batch/realtime split gives you the flexibility to use the exact algorithm on the batch layer and an approximate algorithm on the realtime layer." (Conclusion)
- Marz wrote Storm. "I wrote Storm to make it easy to do large amounts of realtime data processing in a way that's scalable and robust." (Realtime layer)
- Hadoop is the batch tool in the design. "Hadoop isn't perfect, but it's the best tool out there for doing batch processing." (Batch computation)

## Visuals worth redrawing

- Batch view + realtime view merged at query time.

## My notes

- The CAP framing is Marz's; Kreps (2014) disputes it. The part that
  lasted is immutability and recomputation.
