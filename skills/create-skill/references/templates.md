# Skill templates

Copy-ready scaffolds. Every value obeys `schema.md`. Replace the placeholders, and keep the
directory name identical to the frontmatter `name`.

## Minimal skill (most cases)

`<skills-dir>/<name>/SKILL.md`:

```markdown
---
name: <name>
description: "Use when the user asks to <do X> or <do Y>. Triggers on: '<phrase one>', '<phrase two>', '<phrase three>'."
---

# <Title>

<One or two sentences: what this skill is for and the contract it follows.>

## Steps

1. <First imperative step, with a real command if relevant.>
2. <Next step.>
3. <Verification — what "done" looks like.>

## Notes

- <Non-obvious gotcha or constraint the agent must respect.>
```

## Full skill (with metadata + bundled resources)

Directory:

```
<name>/
├── SKILL.md
├── references/
│   └── <topic>.md
├── scripts/
│   └── <tool>.ts
└── assets/
    └── <template-or-boilerplate>
```

`SKILL.md`:

```markdown
---
name: <name>
description: "Use when the user asks to <task>. Triggers on: '<phrase one>', '<phrase two>'. <One clause on scope or limits.>"
license: MIT
compatibility: "Requires <runtime/tool> available on PATH."
metadata:
  author: <you>
  triggers: "<alias1>, <alias2>, <alias3>"
allowed-tools: "bash, read, glob, grep"
---

# <Title>

<Purpose in 1–3 sentences. Write for an agent to execute.>

## Procedure

1. <Step.>
2. <Step that points at a reference: see `references/<topic>.md`.>
3. <Step that runs a bundled script: `bun scripts/<tool>.ts <args>`.>
4. <Step that copies an asset into output: `cp assets/<file> <dest>`.>
5. <Validate / deliver.>

## Resources
- **`references/<topic>.md`** — <what it contains and when to read it>.
- **`scripts/<tool>.ts`** — <what it does>.
- **`assets/<file>`** — <what it's used for in the output>.
```

## Notes on the optional fields

- `metadata.triggers` — comma-separated string (shown) or a YAML array. Feeds `@`-mention
  discovery. Omit it if the skill name already says it all.
- `metadata` values must all be **strings** — quote versions/numbers (`version: "1.0"`).
- `compatibility` is a free-form human note, ≤500 chars.
- `allowed-tools` is informational; include it for documentation, not enforcement.
- Only the keys listed in `schema.md` are recognized; any others are ignored.

## `agents/openai.yaml` (only if UI metadata is needed)

```yaml
interface:
  display_name: "<Display Name>"
  short_description: "<one line>"
  default_prompt: "<a starter prompt>"
```

After scaffolding, always run `bun ~/.cowork/skills/create-skill/scripts/validate-skill.ts <dir>`.
