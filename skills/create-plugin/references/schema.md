# Plugin manifest reference

The complete rules for `.cowork-plugin/plugin.json`. The manifest is **strict**: any unrecognized
top-level key makes the plugin fail to load. The validator in `scripts/` reproduces these checks.

## Directory layout

```
<plugin-root>/
├── .cowork-plugin/
│   └── plugin.json           # required; the manifest
├── skills/                   # default skills path (./skills/)
│   └── <skill-name>/SKILL.md
├── .mcp.json                 # optional; default path when mcpServers is omitted
└── .app.json                 # optional; default path when apps is omitted
```

## Top-level fields

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `name` | **yes** | string | Trimmed, non-empty, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` (kebab-case). |
| `version` | no | string | Non-empty (e.g. `"1.0.0"`). |
| `description` | no | string | Non-empty. Falls back to `interface.shortDescription`, then `name`, if omitted. |
| `author` | no | string \| object | See **Author** below. |
| `homepage` | no | string | Non-empty URL. |
| `repository` | no | string | Non-empty URL. |
| `license` | no | string | Non-empty (e.g. `"MIT"`). |
| `keywords` | no | string[] | Array of non-empty strings. |
| `skills` | no | string \| string[] | Path(s) to skills directories, relative to root. Default `./skills/`. |
| `mcpServers` | no | string | **Path** to a `.mcp.json`. Default `./.mcp.json`. Never an inline object. |
| `apps` | no | string | **Path** to a `.app.json`. Default `./.app.json`. |
| `interface` | no | object | UI metadata. See **Interface** below. |

Any key not in this list fails validation.

## Author (`author`)

Either a plain string, or a strict object:

```json
"author": "Jane Doe"
```
```json
"author": { "name": "Jane Doe", "email": "jane@example.com", "url": "https://example.com" }
```

The object form allows only `name`, `email`, `url` — each a non-empty string; any other key fails.

## Interface (`interface`)

A strict object; include only the keys you need. All string values must be non-empty.

| Key | Type |
|-----|------|
| `displayName`, `shortDescription`, `longDescription`, `developerName`, `category` | string |
| `websiteURL`, `privacyPolicyURL`, `termsOfServiceURL` | string |
| `brandColor`, `composerIcon`, `logo` | string |
| `capabilities` | string[] |
| `screenshots` | string[] |
| `defaultPrompt` | string \| string[] |

Any key outside this set fails validation.

## Path resolution and the inside-root rule

`skills`, `mcpServers`, and `apps` are resolved relative to the plugin root, then checked to ensure
they stay **inside** the root. A `../escape` path fails.

- **`skills`**: defaults to `./skills/`. When **explicitly declared**, the directory **must exist**
  (loading throws otherwise). When omitted, the default `./skills/` need not exist (the plugin
  simply bundles no skills). Array form declares multiple skills roots, each of which must exist.
- **`mcpServers`**: resolved (default `./.mcp.json`); must be inside root. Used only if the file
  exists. Format in `mcp-and-apps.md`.
- **`apps`**: resolved (default `./.app.json`); must be inside root. Used only if the file exists.
  Format in `mcp-and-apps.md`.

## Bundled skills

For each subdirectory under a skills path, `<dir>/SKILL.md` is parsed with the **same** rules as a
standalone skill (`name` must equal the directory name, etc. — see the `create-skill` skill's
`references/schema.md`). A malformed bundled skill is skipped with a warning; it does not fail the
whole plugin, but it won't be available. Loaded skills register as `<plugin-name>:<skill-name>`.

## Install metadata (`.cowork-plugin/install.json`)

Written by the install pipeline, not by hand (records provenance). Not required for a hand-authored
plugin.
