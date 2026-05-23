# Contributing

This repo is a Cowork plugin catalog. Keep the structure close to the public
plugin-catalog pattern: marketplace metadata under `.agents/`, packages under
`plugins/`, and skills nested inside the plugin that owns them.

## Before Editing

1. Read the relevant plugin manifest first.
2. Read the relevant `SKILL.md` before changing a skill.
3. Check nearby plugin packages for existing patterns before adding structure.
4. Keep generated outputs, scratch files, and local experiments out of git.

## Creating a Plugin

Expected shape:

```text
plugins/<plugin-name>/
|-- .cowork-plugin/
|   `-- plugin.json
|-- agents/
|   `-- cowork.yaml
|-- skills/
|   `-- <skill-name>/
|       `-- SKILL.md
|-- assets/
|-- scripts/
|-- .mcp.json
`-- .app.json
```

Only include optional folders and files when they are actually needed.

Each new plugin should also be added to `.agents/plugins/marketplace.json`:

```json
{
  "name": "plugin-name",
  "source": {
    "source": "local",
    "path": "./plugins/plugin-name"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

## Creating a Skill

1. Put the skill under `plugins/<plugin-name>/skills/<skill-name>/`.
2. Pick a lower-case hyphenated skill name under 64 characters.
3. Add only the required frontmatter fields:

   ```yaml
   ---
   name: skill-name
   description: Use when Cowork needs to...
   ---
   ```

4. Put trigger language in `description`; put operating instructions in the
   Markdown body.
5. Keep `SKILL.md` concise. Move detailed reference material to direct child
   files such as `references/api.md` or `templates/finance.md`.
6. Add scripts only when repeatability or reliability matters.
7. Validate before finishing.

## Skill Checklist

- `SKILL.md` exists.
- Folder name, frontmatter `name`, and references all agree.
- Frontmatter contains only `name` and `description`.
- Description says both what the skill does and when to use it.
- The body tells Cowork how to work, not why the skill was created.
- Optional resources are linked from `SKILL.md` so they are discoverable.
- Long reference files have clear headings or a table of contents.
- Scripts are runnable and have been smoke-tested.
- No generated outputs, local notes, secrets, or temporary files are included.

## Validation Commands

Validate all current skills:

```powershell
Get-ChildItem .\plugins -Directory | ForEach-Object {
  Get-ChildItem "$($_.FullName)\skills" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    python -X utf8 "$env:USERPROFILE\.cowork\skills\.system\skill-creator\scripts\quick_validate.py" $_.FullName
  }
}
```

If your validator is installed somewhere else locally, use that real path.

## Documentation Rules

- Put repo-level explanations in `README.md`, `CONTRIBUTING.md`, or `docs/`.
- Plugin-level READMEs are fine.
- Do not add README files inside individual skill folders.
- Do not paste large API references into `SKILL.md`; link a focused reference
  file instead.
- Keep instructions imperative and directly useful to the next agent.

## Release Hygiene

Before sharing or publishing:

1. Validate every changed skill.
2. Parse every changed `plugin.json` and `.agents/plugins/marketplace.json`.
3. Check git status for accidental outputs.
4. Review files for secrets, local paths that should not travel, and stale
   provenance metadata.
5. Decide on licensing before publishing copied or derived curated skills.
