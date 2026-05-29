# Plugin templates

Copy-ready scaffolds. Every value obeys `schema.md`. Keep `name` kebab-case, and keep all declared
paths inside the plugin root.

## Minimal plugin (bundles one skill)

Layout:

```
my-plugin/
├── .cowork-plugin/
│   └── plugin.json
└── skills/
    └── my-skill/
        └── SKILL.md
```

`.cowork-plugin/plugin.json`:

```json
{
  "name": "my-plugin",
  "description": "What this plugin does.",
  "skills": "./skills/"
}
```

`skills/my-skill/SKILL.md` — author with the `create-skill` skill:

```markdown
---
name: my-skill
description: "Use when the user asks to <task>. Triggers on: '<phrase>', '<phrase>'."
---

# My Skill

<imperative body>
```

## Full plugin (interface + MCP + apps)

Layout:

```
my-plugin/
├── .cowork-plugin/
│   └── plugin.json
├── skills/
│   ├── skill-one/SKILL.md
│   └── skill-two/SKILL.md
├── .mcp.json
└── .app.json
```

`.cowork-plugin/plugin.json`:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Bundled skills plus an MCP server.",
  "author": { "name": "Jane Doe", "email": "jane@example.com" },
  "homepage": "https://example.com",
  "repository": "https://github.com/example/my-plugin",
  "license": "MIT",
  "keywords": ["productivity", "automation"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "apps": "./.app.json",
  "interface": {
    "displayName": "My Plugin",
    "shortDescription": "Skills + tools for X",
    "category": "Productivity",
    "capabilities": ["file-access"],
    "websiteURL": "https://example.com",
    "brandColor": "#4F46E5",
    "logo": "logo.png"
  }
}
```

`.mcp.json` (referenced by `mcpServers`; see `mcp-and-apps.md` for the full format):

```json
{
  "mcpServers": {
    "my-server": { "type": "stdio", "command": "my-mcp-server", "args": [] }
  }
}
```

`.app.json` (referenced by `apps`):

```json
{
  "apps": [
    { "id": "my-app", "displayName": "My App", "description": "What it does", "authType": "oauth" }
  ]
}
```

> `mcpServers` and `apps` in `plugin.json` are **paths** (`"./.mcp.json"`, `"./.app.json"`). The
> server map and app list live **inside** those files — never inline in `plugin.json`. Every MCP
> server entry needs a `type` (`stdio`, `http`, or `sse`).

## Multiple skills roots

```json
{ "name": "my-plugin", "skills": ["./skills/", "./extra-skills/"] }
```

Each declared skills path must exist and stay inside the root.

## Reminders
- The manifest is strict — only the keys in `schema.md` are allowed; any others are rejected.
- When `skills` is **declared**, the directory must exist; omit it to default to `./skills/`.
- After scaffolding, run `bun ~/.cowork/skills/create-plugin/scripts/validate-plugin.ts <root>`.
