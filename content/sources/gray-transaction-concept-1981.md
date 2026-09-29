---
id: gray-transaction-concept-1981
title: "The Transaction Concept: Virtues and Limitations"
author: Jim Gray
url: https://jimgray.azurewebsites.net/papers/thetransactionconcept.pdf
kind: paper
primary: true
---

## Summary

Jim Gray's 1981 paper (VLDB, Tandem TR 81.3) that states the transaction
idea: a group of actions that commits or aborts as one. It lists three
properties (consistency, atomicity, durability), sorts actions into
unprotected, protected and real, and names the open problems: nested
and long-lived transactions.

## Key claims

- A transaction is a state change with atomicity, durability and consistency. "A transaction is a transformation of state which has the properties of atomicity (all or nothing), durability (effects survive failures) and consistency (a correct transformation)." (Abstract)
- The idea comes from contracts. "The transaction concept derives from contract law." (Introduction)
- The three properties as first listed; isolation is not one of them in this paper. "Atomicity: it either happens or it does not; either all are bound by the contract or none are." (Introduction)
- Commit or abort, nothing in between. "Transactions must be atomic and durable: either all actions are done and the transaction is said to commit, or none of the effects of the transaction survive and the transaction is said to abort." (A general model of transactions)
- Some actions can't be undone at all. "Real: once done, the action cannot be undone." (A general model of transactions)
- Examples of real actions. "Transaction commitment and operations on real devices (cash dispensers and airplane wings) are examples of real actions." (A general model of transactions)
- A committed transaction is fixed by running another one. "Such post facto transactions are called compensating transactions." (A general model of transactions)
- Transactions that last days break the locking model. "Now suppose that transactions with lifetimes of a few days or weeks appear." (Long-lived transactions)
- Gray names long-lived and nested transactions as problems current techniques can't handle. "But I believe that the problems I have outlined here (long-lived and nested transactions) must be solved." (Summary)

## Visuals worth redrawing

None.

## My notes

- Isolation is discussed through locking later in the paper but isn't
  one of the named properties. Haerder and Reuter (1983) added the I and
  named ACID.
