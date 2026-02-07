# ADR 001: Use GKE for Container Orchestration

## Status
Accepted

## Context
We need a container orchestration platform that supports both application workloads and AI inference with autoscaling.

## Decision
Use Google Kubernetes Engine (GKE) with separate node pools for general and AI workloads.

## Consequences
- Positive: Mature platform, deep GCP integration, Workload Identity support
- Positive: Separate AI node pool allows GPU/high-memory machines without affecting app costs
- Negative: Kubernetes complexity, requires K8s expertise
- Mitigation: Use Cloud Run for bursty AI inference to reduce K8s surface area over time
