# Skill format reference

The complete set of rules applied to every `SKILL.md`. A skill that violates any required field or
limit is treated as invalid and is **not** made available. The validator in `scripts/` reproduces
each of these checks.

## Directory layout

```
<skills-dir>/
└── <skill-name>/            # directory name MUST equal frontmatter `name`
    ├── SKILL.md             # required — frontmatter + body
    ├── references/          # optional — loaded on demand
    ├── scripts/             # optional — runnable code
    ├── assets/              # optional — files used in output
    └── agents/openai.yaml   # optional — UI interface metadata
```

`<skills-dir>` is one of: `<project>/.cowork/skills/`, `~/.cowork/skills/`, or the built-in skills
directory. Project shadows user shadows built-in on a name collision.

## Frontmatter format

YAML frontmatter delimited by `---` fences, then the markdown body:

```markdown
---
name: my-skill
description: "..."
---

# Body starts here
```

The opening fence must be the first line (a leading byte-order mark is tolerated). Both `\n` and
`\r\n` line endings work. The frontmatter is parsed as YAML and must be a mapping (object). Missing
frontmatter, non-object frontmatter, or a YAML parse error → the skill is rejected.

## Fields

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `name` | **yes** | string | Trimmed, 1–64 chars, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase alphanumerics joined by single hyphens; no leading/trailing/double hyphens). **Must equal the directory name.** |
| `description` | **yes** | string | Trimmed, 1–1024 chars. This is what an agent reads to decide invocation — make it specific. |
| `license` | no | string | Trimmed, non-empty. Free-form (e.g. `MIT`, `Apache-2.0`). |
| `compatibility` | no | string | Trimmed, 1–500 chars. Free-form environment note (e.g. "Requires macOS 26+"). |
| `metadata` | no | map | An object whose **every value is a string**. A numeric, boolean, or nested-object value fails validation — quote values like `version: "1.0"`. |
| `allowed-tools` | no | string | Trimmed, non-empty. Informational only; not enforced at runtime. |

Unknown keys are kept but ignored — they have no effect, so only the keys above are meaningful.

## Triggers (discovery)

Short aliases that help route `@`-mentions and auto-discovery to the skill. They are read in this
order:
1. A top-level `triggers` key, **or**
2. `metadata.triggers`,

each accepted as either a **comma-separated string** or a **YAML array** of strings. If neither is
present, discovery falls back to the skill's directory name.

```yaml
metadata:
  triggers: "invoice, receipt, expense report"   # comma-separated string
# or:
triggers:                                          # array form
  - invoice
  - receipt
```

## Body

Everything after the closing `---` fence is the body. When the skill is invoked, the body is
injected verbatim as authoritative instructions; the frontmatter is stripped first. Write it for an
agent to execute.

## `agents/` interface (optional)

If the skill directory contains `agents/`, one YAML file there supplies UI metadata: `openai.yaml`
is preferred, otherwise the first `*.yaml`/`*.yml` alphabetically. Only these keys, under a
top-level `interface:` mapping, are read:

```yaml
interface:
  display_name: "Invoice Tools"
  short_description: "Generate and parse invoices"
  default_prompt: "Create an invoice from this data"
  icon_small: "./icon-32.png"   # resolved within the skill directory; escape attempts are dropped
  icon_large: "./icon-128.png"
```

## Install manifest (`.cowork-skill.json`)

Written automatically when a skill is installed or imported — not by hand. It records install
provenance for update tracking. Discovery does **not** require it: a hand-placed directory with a
valid `SKILL.md` is fully functional without one.

## What rejection looks like

Any of these drops the skill: missing `SKILL.md`; absent, non-object, or unparseable frontmatter;
`name` failing the regex or length; `name` ≠ directory name; `description` empty or >1024;
`compatibility` >500; a non-string `metadata` value.
