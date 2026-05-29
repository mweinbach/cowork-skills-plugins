# MCP servers and apps in a plugin

A plugin can bundle **MCP servers** (external tool servers) and **app integrations**. Each is a
separate JSON file referenced by a path in the manifest:

```json
{ "name": "my-plugin", "skills": "./skills/", "mcpServers": "./.mcp.json", "apps": "./.app.json" }
```

Both paths default to `./.mcp.json` and `./.app.json` when omitted, must resolve **inside** the
plugin root, and are simply ignored if the file does not exist. The manifest value is always a
**path string** — the actual definitions live in the referenced file.

---

## `.mcp.json` — MCP servers

Top-level shape (strict — only the `mcpServers` key is allowed):

```json
{
  "mcpServers": {
    "<server-name>": { /* server config */ }
  }
}
```

Each key under `mcpServers` is a server name. Its tools are exposed to the agent namespaced as
`mcp__<server-name>__<tool-name>`.

### Server config

Every server declares a **transport**, and `type` is **required** (it selects the transport). Two
equivalent forms are accepted:

**Shorthand** (transport fields inline — preferred):

```json
{ "type": "stdio", "command": "my-server", "args": ["--flag"], "env": { "KEY": "value" }, "cwd": "./srv" }
```
```json
{ "type": "http", "url": "https://api.example.com/mcp", "headers": { "X-Trace": "1" } }
```

**Wrapped** (transport nested under `transport`):

```json
{ "transport": { "type": "stdio", "command": "my-server" }, "enabled": true, "retries": 2 }
```

All server configs are strict (no extra keys). Transports:

| `type` | Required | Optional |
|--------|----------|----------|
| `stdio` | `command` | `args` (string[]), `env` (string→string), `cwd` |
| `http` / `sse` | `url` | `headers` (string→string) |

Optional fields on any server (both forms): `enabled` (boolean), `required` (boolean), `retries`
(number), `auth` (see below).

### Auth

`auth` is one of three discriminated shapes (each strict):

```json
{ "type": "none" }
{ "type": "api_key", "headerName": "Authorization", "prefix": "Bearer", "keyId": "my-credential" }
{ "type": "oauth", "scope": "read write", "resource": "https://api.example.com", "oauthMode": "code" }
```

- `api_key.keyId` references a credential resolved by the app's auth layer — do **not** embed
  secrets in the file. For a static token, an HTTP `headers` entry or stdio `env` value also works,
  but prefer `auth` for managed credentials.
- `oauth.oauthMode` is `"auto"` or `"code"`.

### Worked example

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/data"],
      "env": { "LOG_LEVEL": "info" }
    },
    "search-api": {
      "type": "http",
      "url": "https://search.example.com/mcp",
      "auth": { "type": "oauth", "scope": "search.read", "oauthMode": "code" },
      "required": false
    }
  }
}
```

> Note: a user/project-level MCP config file (`mcp-servers.json`) uses a different shape — an array
> under a `servers` key, each entry carrying its own `name`. The plugin `.mcp.json` above uses the
> **object/map** form (`mcpServers: { name: config }`). Use the map form inside a plugin.

---

## `.app.json` — app integrations

Declares apps surfaced in the UI (name, description, auth type). The parser is flexible and accepts
three shapes — pick one:

**Array under `apps`:**
```json
{
  "apps": [
    { "id": "github", "displayName": "GitHub", "description": "Repos and issues", "authType": "oauth" },
    { "id": "local", "displayName": "Local Service" }
  ]
}
```

**Object under `apps`** (the key is the id):
```json
{
  "apps": {
    "github": { "displayName": "GitHub", "description": "Repos and issues", "authType": "oauth" }
  }
}
```

**Root-level map** (each top-level key is an app id):
```json
{
  "github": { "displayName": "GitHub", "authType": "oauth" }
}
```

### App fields

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Taken from `id`, or `name` if `id` is absent. |
| `displayName` | effectively yes | Defaults to `id` when omitted. |
| `description` | no | Included only if non-empty. |
| `authType` | no | Free-form string (e.g. `"oauth"`, `"api_key"`). Included only if non-empty. |

---

## Checklist
- `mcpServers` / `apps` in `plugin.json` are **path strings**, not inline objects.
- Every MCP server entry includes a `type` (`stdio`, `http`, or `sse`).
- No secrets committed in `.mcp.json` — use `auth` with a credential reference.
- Both files resolve inside the plugin root.
- Run `scripts/validate-plugin.ts` after adding either file.
