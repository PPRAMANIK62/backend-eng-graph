---
id: authzed-new-enemy-problem-2021
title: "Enforcing Causal Ordering in Distributed Systems: The Importance of Permissions Checking"
author: Jake Moshenko (AuthZed)
url: https://authzed.com/blog/new-enemies
kind: blog
primary: true
---

## Summary

A blog post from AuthZed, who build SpiceDB, on the new enemy problem.
A made-up story (door codes that sync nightly) shows the problem, then
the post explains why the causal link runs from permission changes to
content changes, and how storing a zookie with each content version
fixes it. Written in 2021 with Zanzibar terms.

## Key claims

- The problem comes from replication delay breaking causal order between a revocation and new content. "there was a replication delay which broke the causal ordering requirement between revoking the interns’ access and the start of the party." (The New Enemy Problem)
- Permissions and the data they protect usually form an ad-hoc distributed system, even when stored together, because the policy lives elsewhere. "In many applications, permissions and the data they protect form an ad-hoc distributed system." (Latency in Distributed Systems)
- Seeing an old copy of something you already had access to leaks nothing new. "It turns out that nobody should really care if someone is given access to an exact copy of something that they once had access to." (Content is King)
- Zookie is a portmanteau of Zanzibar and cookie. "This token is called a Zookie (a portmanteau of Zanzibar and cookie)." (I Did It All for the Zookie)
- Pattern: on write, do a content-change check, store the returned zookie with the content; on read, load content and zookie together and pass the zookie to the check. (I Did It All for the Zookie, pseudocode)
- The trade: grants may show up late (false negatives), but no false positives. "This is an explicit choice to improve the performance of the system, while always guaranteeing that no false positives are ever issued." (No, You May!)
- You can also update the stored zookie when permissions change, trading datastore load for fewer false negatives. (No, You May!)

## Visuals worth redrawing

None.

## My notes

- The post itself says it uses Zanzibar terms and will be updated to
  current AuthZed terms (ZedToken).
