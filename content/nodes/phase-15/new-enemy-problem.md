---
id: new-enemy-problem
title: The new-enemy problem
depth: short
phase: 15
note: >-
  A permission change applied out of order lets the wrong person in. How
  zookies stop it.
needs: [zanzibar]
leads_to: []
compare_with: [replication-lag, row-level-security, causal-consistency]
---

# The new-enemy problem

You remove someone's access, then add something they shouldn't see.
If a permission check uses data from before the removal, they see it
anyway. That's the new-enemy problem: someone who was trusted a
moment ago, and isn't now, gets in through a stale or out-of-order view
of permissions. Google's [[zanzibar|Zanzibar]] paper describes it and solves it with a
token called a zookie.

## Two ways it happens

Zanzibar's paper gives two versions.

**Changes applied out of order.** Alice removes Bob from a folder.
Then she asks Charlie to move some new documents into it, and those
documents inherit the folder's permissions. If a check sees the second
change (the documents are in the folder) but not the first (Bob is
gone), Bob can read the new documents.

**Old permissions on new content.** Alice removes Bob from a
document. Then she asks Charlie to add new text to it. If the check
for Bob runs on a copy of the permissions from before his removal, he
sees the new text.

Neither needs a bug in the permission logic. Both come from reading
permissions that are behind, which is normal in any system with
caches or replicas (see [[replication-lag]]). Alice's two steps are
also linked through a person, Charlie. No system can see that link,
so it can't order the two steps by watching messages between
machines.

![Two timelines. Top, without a token: at T1 Bob is removed from the document, at T2 new text is saved, then Bob's check is served from a cache or replica still at snapshot T0, sees Bob as a viewer, and shows him the new text. Bottom, with a zookie: saving the text at T2 stores zookie T2 with it; Bob's check sends zookie T2, so it must use a snapshot at T2 or later, which includes the removal at T1, and Bob is denied.](img/new-enemy-problem-timeline.svg)

*Old permissions applied to new content, with and without a zookie. Based on example B in Pang et al., "Zanzibar" (2019).*

## How zookies fix it

Zanzibar's storage gives every write a timestamp, and if one change
caused another, the first gets the smaller timestamp. A check reads
everything as of one timestamp, so it can't see a later change without
the earlier ones. That handles the out-of-order case.

For the stale case, the content itself carries a timestamp:

1. When Charlie's edit is about to be saved, the app asks Zanzibar
   whether he may make it. That check runs on the latest data and
   returns a zookie, an opaque token holding a timestamp.
2. The app stores the zookie with the new content, in the same write.
3. Any later check on that content sends the zookie along. Zanzibar
   must answer from data at least that fresh.

Bob's removal happened before Charlie's edit, so its timestamp is
smaller than the zookie's. Any snapshot at least as fresh as the
zookie includes the removal, and Bob is denied.

The rule is "at least as fresh", not "the latest". That leaves room to
answer from a local replica or a cache most of the time. It's safe
because showing Bob slightly old permissions on content he could
already see teaches him nothing new. The danger starts when content
changes after access does, and that's exactly the moment the zookie
records.

## Where it gets tricky

**Grants can show up late.** Zookies only make checks as fresh as the
content. If Alice shares a document with Carol without changing the
document, Carol may be refused for a short while. That's a deliberate
trade: false negatives are allowed, false positives aren't. You can
also refresh the stored token when access changes, at the cost of more
writes to your database.

**Caches make it worse.** SpiceDB, a Zanzibar-style system, caches
check results, and its default read mode picks whatever is most
likely cached. Used on its own, that mode leaves a window for the new
enemy problem. Its tokens, called ZedTokens, close it.

**Order needs real timestamps.** Zanzibar leans on Spanner's clock to
give [[causal-consistency|causally related]] writes ordered timestamps. Lamport clocks don't
fit, because they need every participant to carry the clock, and here
one participant is a human asking a colleague to do something.

## Further reading

- [Zanzibar: Google's Consistent, Global Authorization System](https://www.usenix.org/system/files/atc19-pang.pdf), Ruoming Pang and others, USENIX ATC, 2019. Section 2.2 defines the problem with both examples and the zookie protocol.
- [Enforcing Causal Ordering in Distributed Systems: The Importance of Permissions Checking](https://authzed.com/blog/new-enemies), Jake Moshenko, AuthZed, 2021. A plain explanation, why old content is safe to show, and the false-negative trade.
- [Consistency](https://authzed.com/docs/spicedb/concepts/consistency), SpiceDB documentation. How a real Zanzibar-style system exposes the choice per request.
