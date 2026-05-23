# Cowork Plugins

This repository contains a personal collection of Cowork plugin examples.

Each plugin lives under `plugins/<name>/` with a required
`.cowork-plugin/plugin.json` manifest and optional companion surfaces such as
`skills/`, `.app.json`, `.mcp.json`, plugin-level `agents/`, `commands/`,
`hooks.json`, `assets/`, and other supporting files.

The marketplace catalog lives at `.agents/plugins/marketplace.json` and points
to the local plugin packages in `plugins/`.

## Plugins

- `plugins/documents` for DOCX creation, editing, redlining, comments, OOXML
  helpers, and render-based verification.
- `plugins/presentations` for polished editable PPTX decks, claim-spine work,
  rendered previews, and visual QA.
- `plugins/spreadsheets` for XLSX/CSV workbook creation, formulas, formatting,
  charts, domain templates, and verification.

## Repository Layout

```text
.
|-- .agents/
|   `-- plugins/
|       `-- marketplace.json
|-- plugins/
|   `-- <plugin-name>/
|       |-- .cowork-plugin/
|       |   `-- plugin.json
|       |-- agents/
|       |   `-- cowork.yaml
|       |-- skills/
|       |   `-- <skill-name>/
|       |       `-- SKILL.md
|       |-- assets/
|       |-- .mcp.json
|       `-- .app.json
|-- CONTRIBUTING.md
`-- README.md
```

Only include optional folders when they are useful. A skill-backed plugin can be
as small as a manifest plus `skills/<skill-name>/SKILL.md`.

## Plugin Format

`plugins/<name>/.cowork-plugin/plugin.json` is the package manifest. Keep it
focused on plugin-level metadata: name, version, description, author, license,
keywords, skills path, optional app/MCP surfaces, and UI metadata.

`plugins/<name>/agents/cowork.yaml` is lightweight UI metadata for plugin lists
and chips.

`plugins/<name>/skills/<skill-name>/SKILL.md` starts with skill frontmatter:

```yaml
---
name: my-skill
description: Use when Cowork needs to do the specific workflow this skill covers.
---
```

Keep skill frontmatter to `name` and `description`. The description is the
trigger surface; the body should contain the operating instructions.

## Marketplace

The catalog file follows this shape:

```json
{
  "name": "cowork-personal",
  "interface": {
    "displayName": "Cowork Personal"
  },
  "plugins": [
    {
      "name": "documents",
      "source": {
        "source": "local",
        "path": "./plugins/documents"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

Append new entries to `.agents/plugins/marketplace.json` when adding plugins.
Keep `source.path` relative to the repository root.

## Validation

Validate changed skills with UTF-8 enabled on Windows:

```powershell
Get-ChildItem .\plugins -Directory | ForEach-Object {
  Get-ChildItem "$($_.FullName)\skills" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    python -X utf8 "$env:USERPROFILE\.cowork\skills\.system\skill-creator\scripts\quick_validate.py" $_.FullName
  }
}
```

If your local validator still lives under another app directory, use that real
validator path. The skill format is the same; the repo naming is Cowork.

## Publishing Notes

The current plugin manifests are marked `UNLICENSED` because this is a personal
Cowork catalog. Pick an explicit license before publishing it as a public or
shared repository.
