---
id: github-graphql-limits
title: Rate limits and query limits for the GraphQL API
author: GitHub
url: https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api
kind: docs
primary: true
---

## Summary

How GitHub's public GraphQL API limits clients: a points budget per
hour where each query costs points based on how many objects it could
touch, required page sizes on every connection, a total node limit, and
a 10-second timeout. Read when this was written; GitHub says the
numbers can change.

## Key claims

- Queries are charged points, not counted as requests. "The GraphQL API assigns points to each query and limits the points that you can use within a specific amount of time." (Primary rate limit)
- Users get 5,000 points per hour. "For users: 5,000 points per hour per user." (Primary rate limit)
- The formula can change. "The formula for calculating points and the rate limit are subject to change." (Primary rate limit)
- To predict cost, add up the requests each connection needs, assuming full pages. "Add up the number of requests needed to fulfill each unique connection in the call. Assume every request will reach the first or last argument limits." (Predicting the point value of a query)
- Then divide by 100 and round. "Divide the number by 100 and round the result to the nearest whole number to get the final aggregate point value." (Predicting the point value of a query)
- Worked example: repositories(first: 100) → issues(first: 50) → labels(first: 60) needs 5,101 requests and scores 51. "This query requires 5,101 requests to fulfill:" (Predicting the point value of a query)
- Every connection needs first or last. "Clients must supply a first or last argument on any connection." (Node limit)
- Page sizes from 1 to 100. "Values of first and last must be within 1-100." (Node limit)
- At most 500,000 nodes per call. "Individual calls cannot request more than 500,000 total nodes." (Node limit)
- Requests over 10 seconds are terminated. "If GitHub takes more than 10 seconds to process an API request, GitHub will terminate the request" (Timeouts)
- The REST API has its own, separate limit. "The REST API also has a separate primary rate limit." (Primary rate limit)

## Visuals worth redrawing

None.

## My notes

- The 5,101 figure: 1 (repositories) + 100 (issues, one per repo) +
  5,000 (labels, one per issue) = 5,101.
