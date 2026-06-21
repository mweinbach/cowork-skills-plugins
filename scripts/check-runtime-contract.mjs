#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const pluginRoot = path.join(repoRoot, "plugins", "workspace-tools");
const expectedSkills = ["documents", "pdf", "presentations", "spreadsheets"];
const requiredHelpers = [
  "skills/presentations/scripts/artifact_tool_utils.mjs",
  "skills/presentations/scripts/render_lucide_icon.mjs",
];
const documentRenderer = "skills/documents/render_docx.py";
const forbiddenFragments = [
  ".cache/codex-runtimes",
  ".cache\\codex-runtimes",
  ".cache/cowork-runtimes",
  ".cache\\cowork-runtimes",
  "cowork-primary-runtime",
  "COWORK_RUNTIME_PLUGINS_DIR",
];

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

const errors = [];
for (const skillName of expectedSkills) {
  const skillPath = path.join(pluginRoot, "skills", skillName, "SKILL.md");
  const source = await fs.readFile(skillPath, "utf8").catch(() => null);
  if (!source?.startsWith("---")) {
    errors.push(`workspace-tools must include a valid ${skillName}/SKILL.md.`);
  }
}

for (const relativePath of requiredHelpers) {
  const source = await fs.readFile(path.join(pluginRoot, ...relativePath.split("/")), "utf8");
  if (!source.includes("COWORK_RUNTIME_NODE_MODULES")) {
    errors.push(`${relativePath} must resolve packages through COWORK_RUNTIME_NODE_MODULES.`);
  }
}

const rendererSource = await fs.readFile(path.join(pluginRoot, documentRenderer), "utf8");
if (!rendererSource.includes("COWORK_RUNTIME_SOFFICE")) {
  errors.push(`${documentRenderer} must invoke the managed headless soffice launcher.`);
}
if (!rendererSource.includes("SAL_DISABLE_SYNCHRONOUS_PRINTER_DETECTION")) {
  errors.push(`${documentRenderer} must disable synchronous printer detection.`);
}

for (const filePath of await sourceFiles(pluginRoot)) {
  const source = await fs.readFile(filePath, "utf8").catch(() => null);
  if (source === null) continue;
  for (const fragment of forbiddenFragments) {
    if (source.includes(fragment)) {
      errors.push(`${path.relative(repoRoot, filePath)} contains forbidden runtime coupling: ${fragment}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Marketplace skills use the public Cowork runtime environment contract.");
