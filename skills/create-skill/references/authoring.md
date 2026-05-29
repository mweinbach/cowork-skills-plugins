# Authoring effective skills

Methodology for writing skills that trigger at the right time and help an agent execute. The format
rules live in `schema.md`; this file is about *quality*.

## Progressive disclosure

Context loads in three levels — design for it:

1. **Metadata** (`name` + `description`) — always available. Keep it tight and trigger-rich.
2. **`SKILL.md` body** — loaded when the skill is invoked. Keep lean (target <2,000 words).
3. **Bundled resources** (`references/`, `scripts/`, `assets/`) — pulled in only when needed.
   Effectively unlimited, because scripts can run without being read into context.

Put essential procedure in the body; move schemas, deep guides, and long examples to `references/`.
Information should live in one place — body **or** a reference file, not both.

## Write a description that triggers

The `description` is the single highest-leverage field: an agent decides whether to invoke the
skill from this text alone. Make it concrete.

- State **when** to use the skill and name the actual tasks and domains.
- Include **literal trigger phrases** a user would type, in quotes.
- Avoid vague summaries ("helps with documents"). Name the verbs and artifacts.

Good:
```yaml
description: "Use when the user asks to redline, comment on, or generate .docx files. Triggers on: 'edit this Word doc', 'add tracked changes', 'create a contract', 'review this redline'."
```
Weak (avoid): `description: "Provides document help."`

Also set `metadata.triggers` (or top-level `triggers`) with short keyword aliases for `@`-mention
discovery (see `schema.md`). Keep them aligned with the phrases in the description.

## Write the body in imperative form

Address the executing agent with verb-first instructions, not second person.

- Do: "Stage related changes together. Run the validator before delivering."
- Don't: "You should stage your changes. You can run the validator."

Lead with the most common path. Use `##`/`###` headings, numbered steps for procedures, and real
commands that name the actual tools available in the environment — generic names like "shell" or
"search" send an agent toward calls that don't exist.

## When to add each resource type

Add a resource only when it earns its place; otherwise a single `SKILL.md` is the right answer.

- **`references/`** — reference material an agent reads while working: API/schema docs, domain
  knowledge, policies, long step-by-step guides, edge-case catalogs. Keeps the body lean. If a
  reference is large (>~10k words), include grep patterns in the body so the agent can find
  sections quickly.
- **`scripts/`** — code an agent would otherwise rewrite each time, or where deterministic behavior
  matters (validators, parsers, generators). Prefer dependency-free scripts so they run wherever the
  skill is installed. Reference how to invoke each one from the body.
- **`assets/`** — files used *in the output*, not read into context: templates, boilerplate
  projects, images, fonts, sample documents the agent copies or fills in. Use these to guarantee
  consistent, high-quality output without spending context tokens.
- **`agents/openai.yaml`** — only if the skill needs a display name or icon in UI surfaces. Optional
  (see `schema.md`).

Always reference what you add from the body (a short "## Resources" list) so it gets discovered.

## Improving an existing skill

The highest-yield edits are usually: (1) sharpen the `description`/`triggers` so it fires at the
right time; (2) move bloated sections from the body into `references/`; (3) replace vague prose with
concrete, runnable steps; (4) add a missing script for a repeated task. Re-run the validator after.

## Common mistakes

- **`name` ≠ directory name** → silently dropped. They must match exactly.
- **Vague description** → never triggers, or triggers on the wrong tasks.
- **Everything in the body** → bloats context; split detail into `references/`.
- **Second-person prose** → ambiguous instructions; use imperative form.
- **Non-string `metadata` values** (e.g. `version: 1`) → frontmatter rejected. Quote them.
- **Unreferenced resources** → the agent never loads them.
