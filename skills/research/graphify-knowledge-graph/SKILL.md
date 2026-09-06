---
name: graphify-knowledge-graph
description: Use Graphify to build, query, and traverse structured Knowledge Graphs across code, thesis documents, and papers. Eliminates token waste and enables multi-hop reasoning.
---

# Graphify Knowledge Graph Skill

Use this skill whenever you need to explore relationships across code, thesis research papers, medical concepts, or system architecture.

## Commands

### 1. Extract / Update Knowledge Graph
```bash
/opt/hermes-agent/venv/bin/graphify extract /root/.hermes/workspace_compartido --code-only
```

### 2. Query Knowledge Graph
Graphify generates structured persistent artifacts in `graphify-out/`:
- `graph.json`: Complete queryable graph nodes and edges (NetworkX / D3 compatible)
- `GRAPH_REPORT.md`: High-level community clusters and summaries
- `.graphify_analysis.json`: Semantic index and cross-references

### 3. Visualizations
To export interactive HTML diagrams for the user:
```bash
/opt/hermes-agent/venv/bin/graphify export html --graph /root/.hermes/workspace_compartido/graphify-out/graph.json
/opt/hermes-agent/venv/bin/graphify export callflow-html --graph /root/.hermes/workspace_compartido/graphify-out/graph.json
```
