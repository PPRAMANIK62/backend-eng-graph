---
id: azure-network-latency
title: Azure network round-trip latency statistics
author: Microsoft Learn (Azure networking docs)
url: https://learn.microsoft.com/en-us/azure/networking/azure-network-latency
kind: docs
primary: true
---

## Summary

Microsoft's published median round-trip times between Azure regions,
measured by probes on its own backbone. Tables by region; the data set
when this was written covered a 30-day period ending in 2026. A real, documented
source for cross-region and cross-continent round trips inside one cloud.

## Key claims

- Method: internal probes on the Azure backbone send packets between regions and time the round trip. "Azure measures round-trip latency using internal network probes that continuously monitor the performance of the Azure backbone network." (How is latency measured?)
- Values are medians. "The latency statistics presented in this article are based on the 50th percentile (P50) of these measurements" (How is latency measured?)
- Data window. The current data set covers a 30-day period ending in 2026. (Round-trip latency data by region)
- Latency is directional: East US -> East US 2 is 8 ms, the reverse 9 ms. "Because latency is directional, the reverse path uses a different value" (How to read the latency tables)
- Tables are updated every 6 to 9 months. "Expect an update to these tables every 6 to 9 months." (Important note)
- Examples (P50, ms, source -> destination): East US -> West US 69; West Europe -> West US 146; Southeast Asia -> West US 170; Central India -> West US 217; West Europe -> UK South 11; West Europe -> North Europe 17; Southeast Asia -> Central India 53; West Europe -> Central India 140; East US -> Central India 198. (West US, UK / Northern Europe and India tabs)

## Visuals worth redrawing

- A small world map or matrix of a few region pairs, next to our own
  home-to-AWS measurements.

## My notes

- Backbone-to-backbone inside Azure, not from a home connection. Our
  experiment 0001 measured home Wi-Fi in India to AWS endpoints, which
  adds the ISP path and uses a different cloud.
- Table values were read from the page text; tab parsing was by hand, so
  re-check any number before quoting it elsewhere.
