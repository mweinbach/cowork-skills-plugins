# Agent Notes

This repo stores personal Cowork plugin packages. Before changing it, inspect
the existing plugin shape and prefer the local pattern.

## Working Rules

- Keep the public plugin-catalog shape: `.agents/plugins/marketplace.json` plus
  `plugins/<plugin-name>/`.
- Use `.cowork-plugin/plugin.json` for plugin manifests.
- Keep skills under `plugins/<plugin-name>/skills/<skill-name>/`.
- Do not add README files inside individual skill folders.
- Put human-facing docs at the repo root, plugin root, or `docs/`.
- Do not add installer provenance files to new personal plugins unless a future
  Cowork installer requires them.
- Validate changed skills with UTF-8 enabled on Windows:

  ```powershell
  python -X utf8 "$env:USERPROFILE\.cowork\skills\.system\skill-creator\scripts\quick_validate.py" .\plugins\<plugin-name>\skills\<skill-name>
  ```

## Repository Shape

- `.agents/plugins/marketplace.json` contains the local plugin catalog.
- `plugins/` contains full plugin packages.
- Each plugin owns its skills, UI metadata, optional app/MCP config, and
  package-specific assets or scripts.
