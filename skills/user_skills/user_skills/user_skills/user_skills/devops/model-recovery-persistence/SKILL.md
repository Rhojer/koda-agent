---
name: model-recovery-persistence
description: "Use when model provider fails to auto-recover and continue."
version: 1.0.0
author: Koda & DEScon
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Reliability, Recovery, Persistence, Model, Failover]
    category: devops
---

# Model Recovery & Persistence

## Purpose
Ensure continuity of execution and response when an LLM provider drops, times out, or hits a rate limit/API failure mid-turn, allowing seamless recovery without requiring the user to re-type or repeat instructions.

## Procedure
1. **State Preservation:** Every ongoing task, file modification, or step state is persisted instantly to disk or session state workspace files (`/home/descon/.hermes/workspace_compartido/`).
2. **Idempotent Retries:** Upon provider reconnection or recovery, inspect session state and workspace files before taking action to avoid duplicate execution.
3. **Seamless Resumption:** Pick up precisely where the process halted, reporting the recovery status briefly and delivering the expected artifact or answer automatically.
