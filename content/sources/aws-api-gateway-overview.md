---
id: aws-api-gateway-overview
title: What is Amazon API Gateway?
author: Amazon Web Services
url: https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html
kind: docs
primary: true
---

## Summary

The overview page for Amazon's managed API gateway: what it fronts,
what it does to requests on the way through, and which features it has.
Useful as a concrete list of what a product called an "API gateway"
takes on.

## Key claims

- A managed service for REST, HTTP and WebSocket APIs. "Amazon API Gateway is an AWS service for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs at any scale." (intro)
- The jobs it takes on. "These tasks include traffic management, authorization and access control, monitoring, and API version management." (Architecture of API Gateway)
- A front door to backends of any kind. "API Gateway acts as a \"front door\" for applications to access data, business logic, or functionality from your backend services" (Architecture of API Gateway)
- Backends can be servers, functions or any web application. "such as workloads running on Amazon Elastic Compute Cloud (Amazon EC2), code running on AWS Lambda, any web application, or real-time communication applications" (Architecture of API Gateway)
- Authentication options: IAM policies, Lambda authorizers, Cognito user pools. (Features of API Gateway)
- Canary release deployments, logging and monitoring, WAF integration. "Canary release deployments for safely rolling out changes." (Features of API Gateway)

## Visuals worth redrawing

None.

## My notes

- Throttling details are on `aws-api-gateway-throttling`.
