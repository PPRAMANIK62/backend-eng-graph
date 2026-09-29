---
id: terry-session-guarantees-1994
title: "Session Guarantees for Weakly Consistent Replicated Data"
author: Douglas B. Terry, Alan J. Demers, Karin Petersen, Mike J. Spreitzer, Marvin M. Theimer, Brent B. Welch
url: https://www.cs.cornell.edu/courses/cs734/2000FA/cached%20papers/SessionGuaranteesPDIS_1.html
kind: paper
primary: true
---

## Summary

The PDIS 1994 paper from Xerox PARC's Bayou project that named read
your writes, monotonic reads, writes follow reads and monotonic writes.
Each is a promise to one session (one application's sequence of reads
and writes) that its view of replicated data stays consistent with its
own actions, even when it talks to different, out-of-date servers.
Read as an HTML copy on a Cornell course page.

## Key claims

- The problem: a client can write at one server and read at another. "For example, a mobile client of a distributed database system could issue a write at one server, and later issue a read at a different server." (1)
- The four guarantees in one line each. "Read Your Writes - read operations reflect previous writes." / "Monotonic Reads - successive reads reflect a non-decreasing set of writes." (1)
- The other two. "Writes Follow Reads - writes are propagated after reads on which they depend." / "Monotonic Writes - writes are propagated after writes that logically precede them." (1)
- Either the system meets the guarantee or it tells the application it can't. "either the storage system ensures them for each read and write operation belonging to a session, or else it informs the calling application that the guarantee cannot be met." (1)
- They cost availability, so they're per session. "Because enforcement of the guarantees restricts the set of servers that may be used within a session, requesting a guarantee can have an adverse impact on availability." (1)
- Read your writes, defined. "RYW-guarantee: If Read R follows Write W in a session and R is performed at server S at time t, then W is included in DB(S,t)." (3.1)
- The Grapevine password example. "After changing his password, a Grapevine user would occasionally type the new password and receive an "invalid password" response." (3.1, example 1)
- The Grapevine fix needs a session that outlives a login. "Notice that this application requires a session to persist across logouts and machine reboots." (3.1, example 1)
- Read your writes says nothing about other sessions' writes. "In particular, Reads within the session may see other Writes that are performed outside the session." (3.1)
- Monotonic reads: later reads only go to copies that have what earlier reads saw. "It ensures that Read operations are made only to database copies containing all Writes whose effects were seen by previous Reads within the session." (3.2)
- The calendar example: meetings appearing and disappearing. "If it accesses servers with inconsistent copies of the database, recently added (or deleted) meetings may appear to come and go." (3.2, example 3)
- Implementation: the client-side session manager keeps two sets of write IDs. "read-set = set of WIDs for the Writes that are relevant to session Reads" / "write-set = set of WIDs for those Writes performed in the session" (4)
- Read your writes check: the server must have the session's write-set. "Before each Read to server S at time t, the session manager must check that the write-set is a subset of DB(S,t)." (4)
- Version vectors make it compact. "With these rules, the state maintained for each session compacts into two version vectors: one to record the session's Writes and one to record the session's Reads" (5)
- Sticking to one server skips the checks. "Thus, if the session manager "latches on" to a given server, then the checks can be skipped." (5)
- Why: the server a session last used always passes the checks. "In particular, the previously contacted server is always an acceptable choice for the server at which to perform the next Read or Write operation." (5)
- The checks come back when the session has to switch servers, for example when its server becomes unavailable. "Only when the session manager switches to a different server, like when the previous server becomes unavailable, must a server's current version vector be compared to the session's vectors." (5)
- Read your writes, mail example: deleted messages shouldn't come back when the reader refreshes from another copy. "she should not see deleted messages reappear simply because the mail reader refreshed its display from a different copy of the database." (3.1, example 2)
- Writes follow reads: a write made after a read is ordered after the writes that read saw, in every copy. "That is, in every copy of the database, Writes made during the session are ordered after any Writes whose effects were seen by previous Reads in the session." (3.3)
- Unlike the first two, writes follow reads affects other clients too. "This guarantee is different in nature from the previous two guarantees in that it affects users outside the session." (3.3)
- The bulletin board example: readers see replies only after the original. "The WFRP-guarantee can be used within this system to ensure that users see the replies to a posted article only after they have seen the original." (3.3, example 6)
- Only the replier needs a session; readers need none. "Users who are only reading articles need not request any guarantees." (3.3, example 6)
- Monotonic writes: a write reaches a copy only after the session's earlier writes. "In other words, a Write is only incorporated into a server's database copy if the copy includes all previous session Writes; the Write is ordered after the previous Writes." (3.4)
- The text editor example: version N+1 must never be overwritten by version N. "it avoids the situation in which version N is written to some server and version N+1 to a different server and the versions get propagated such that version N is applied after N+1." (3.4, example 8)
- The library and application example: new code shouldn't arrive where the library it needs hasn't. "if the new application code gets written to servers that have not yet received the new library, then the code will not compile successfully." (3.4, example 9)
- Monotonic writes check: a server must already hold the session's write-set before accepting a write. "In order for a server S to accept a Write at time t, the server's database, DB(S,t), must include the session's write-set." (4)
- Writes follow reads check: before a write, the server must hold the session's read-set. "Before each Write to server S at time t, the session manager checks that this read-set is a subset of DB(S,t)." (4)
- Monotonic writes also matters to other users. "This guarantee provides assurances that are relevant both to the user of a session as well as to users outside the session." (3.4)
- A version vector has one entry per server. "A version vector is a sequence of <server, clock> pairs, one for each server." (5)
- A shared client cache can break a session's guarantees if another application filled it from an older copy. "When the mail reader executes, allowing it to retrieve data from the cache would likely violate its Monotonic Reads guarantee." (5)
- The guarantees add consistency, not isolation. "Our session guarantees are intended to provide applications with increased consistency, but do not address the problem of isolation between concurrent applications." (6)

## Visuals worth redrawing

- Figure 1, the vector-based Read and Write procedures. Not a picture;
  the idea (check the server's position before reading) is drawn in
  the replication-lag figure instead.

## My notes

- The paper assumes read-any/write-any servers, not a single leader.
  With one leader the same guarantees apply to reads from followers,
  and the "write-set" shrinks to one position in the leader's log.
