# Plugins

Cowork plugin packages live here. Each direct child should be a complete plugin
with a `.cowork-plugin/plugin.json` manifest.

Current plugins:

- `documents`
- `presentations`
- `spreadsheets`

Expected minimum shape:

```text
plugins/<plugin-name>/
|-- .cowork-plugin/
|   `-- plugin.json
`-- skills/
```

Add plugin-level `agents/`, `assets/`, `.mcp.json`, `.app.json`, `commands/`,
or `hooks.json` only when that plugin actually needs them.

