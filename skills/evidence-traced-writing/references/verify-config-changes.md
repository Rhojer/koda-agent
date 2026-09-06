# Verify Config Changes Before Applying

**One-line rule:** any `config.yaml` change proposed by the user or
a tutorial must be verified against the running install before
`hermes config set` runs. Several "official-looking" options are
actually third-party plugins; applying them as if they were
built-in silently breaks the runtime.

## When to use this checklist

- User pastes a YAML snippet from a blog, Reddit, or chat and asks
  you to apply it
- User proposes a `config.yaml` change based on memory of an old
  tutorial
- A skill or session log mentions a config key you don't recognize
- You're about to run `hermes config set <key> <value>` and the key
  isn't already in the active config

## The 30-second verification procedure

```bash
# 1. Does the key exist in the running schema?
hermes config get <key.path>
# → returns a value: key is real, proceed
# → returns null/error: key is NOT built-in, investigate

# 2. If it exists, what are the legal values?
hermes config show | grep -A 10 "<key.path>"
# Compare user's proposed value to the legal values shown

# 3. If it doesn't exist, is it a plugin reference?
grep -r "<proposed_value>" /root/.hermes/skills/ 2>/dev/null
# → match in a skill: probably a plugin, follow that skill's setup
# → no match: probably invented, refuse the change

# 4. If it might be a plugin, check PyPI / docs
hermes plugins list 2>&1 | grep -i "<name>"
# → registered plugin: follow its install instructions
# → not registered: needs `hermes plugins install <name>` first
```

## Decision tree

```
User proposes config change
│
├─ Step 1: hermes config get <key.path>
│  ├─ Returns value → key exists
│  │  └─ Step 2: check value is in legal set → apply
│  └─ Returns null → key is not built-in
│     ├─ Step 3: grep skills for the value
│     │  ├─ Match found → it's a plugin
│     │  │  └─ Install the plugin AND apply the config (3 steps usually)
│     │  └─ No match → probably invented/typo
│     │     └─ Refuse and ask for source
│     └─ Step 4: hermes plugins list | grep -i <name>
│        ├─ Registered → follow plugin install
│        └─ Not registered → hermes plugins install <name>
```

## Real example: `context.engine: "lcm"`

**User proposal (2026-09):**
```yaml
context:
  engine: "lcm"   # lossless context management
```

**Verification steps executed:**

```bash
$ hermes config get context.engine
null    # ← not built-in

$ hermes config show | grep -A 5 "context"
# (no `context` block in the active config)

$ grep -r "lcm\|lossless" /root/.hermes/skills/ 2>/dev/null
# hit: context-engine-plugin doc mentions `engine: "lcm"` as a plugin example
# hit: hermes-lcm is a third-party package on PyPI
```

**Correct answer:** `lcm` is **not** a built-in engine. It is the
`hermes-lcm` third-party plugin (DAG-based, SQLite-backed, "bounded
context, unbounded memory"). The user's `lcm` proposal requires
**all three** of these:

1. `pip install hermes-lcm` (separate Python package)
2. `plugins.enabled: hermes-lcm` in `config.yaml` (register plugin)
3. `context.engine: "lcm"` (activate the engine)

If only #3 is applied, context handling silently fails because
the runtime looks for a registered engine named `lcm` and finds
none.

## What to tell the user

If verification finds a plugin dependency:

> "The option `context.engine: "lcm"` looks built-in but is actually
> a third-party plugin (`hermes-lcm`). To use it, all three are
> needed:
> 1. `pip install hermes-lcm`
> 2. `plugins.enabled: hermes-lcm` in `config.yaml`
> 3. `context.engine: "lcm"`
>
> Or, the built-in lossy compressor can be tuned instead by
> lowering `compression.threshold` (e.g. `0.3`). No plugin install
> needed. Which do you prefer?"

If verification finds nothing:

> "The option `<key.path>` doesn't exist in the running schema and
> doesn't match any installed plugin. Source of the snippet?
> I want to verify before applying — applying a non-existent key
> either errors out or gets ignored silently."

## Common "looks-official-actually-plugin" traps

| Proposal | Real status |
|---|---|
| `context.engine: "lcm"` | Third-party plugin (`hermes-lcm`) |
| `context.engine: "lossless"` | Older name; same plugin family |
| `model: "auto"` | Reserved sentinel for "not configured"; not a real model |
| `compression.engine: "lcm"` | Not a real sub-key; compressor is a single engine, not pluggable under this path |
| Any `mcp_servers.<name>: { url: ... }` | MCP servers must be added via `hermes mcp`; raw YAML is sometimes accepted but not validated |

## Why this matters

A silently-failed config change is worse than a refused one: the
runtime keeps working with old defaults, the user thinks the change
took effect, and the next session that depends on it fails in a
non-obvious way. The 30-second verification costs nothing; the
silent failure costs hours.
