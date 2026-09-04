---
name: skill-self-evolution
description: "Use to update local skills with new workflows."
version: 1.0.0
author: Koda & DEScon
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Skills, Evolution, Maintenance, Workflow]
    category: devops
---

# Skill Self-Evolution

## When to Use
Use immediately after completing a complex task, discovering a better workflow, or identifying an oversight in instructions, to patch and update existing skills so they become more robust.

## Core Rules
1. **Continuous Patching:** Never wait to be asked; if a skill is missing a step, has an outdated command, or lacks a newly proven workflow, patch it immediately via `skill_manage(action='patch')`.
2. **Self-Feedback Loop:** After resolving a challenge or correcting an error, document the lesson inside the corresponding skill's `SKILL.md` file.
3. **Keep Descriptions Clean:** Ensure skill triggers remain short and precise according to authoring standards.
