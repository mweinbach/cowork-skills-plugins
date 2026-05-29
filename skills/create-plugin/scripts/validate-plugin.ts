#!/usr/bin/env bun
/**
 * validate-plugin.ts — check that a directory is a valid plugin.
 *
 * Reproduces the rules the loader applies: a strict .cowork-plugin/plugin.json (kebab-case `name`,
 * no unrecognized keys), `mcpServers`/`apps` as path strings, every declared path resolving inside
 * the plugin root, and each bundled skills/<dir>/SKILL.md passing the skill checks. A PASS means the
 * plugin will load. See ../references/schema.md and ../references/mcp-and-apps.md for the full rules.
 *
 * Usage:  bun validate-plugin.ts <plugin-root>
 * Exit:   0 = valid, 1 = invalid, 2 = usage/IO error.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER_RE = /^﻿?---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;
const MANIFEST_KEYS = new Set([
  "name", "version", "description", "author", "homepage", "repository",
  "license", "keywords", "skills", "mcpServers", "apps", "interface",
]);
const INTERFACE_STRING_KEYS = new Set([
  "displayName", "shortDescription", "longDescription", "developerName", "category",
  "websiteURL", "privacyPolicyURL", "termsOfServiceURL", "brandColor", "composerIcon", "logo",
]);
const INTERFACE_ARRAY_KEYS = new Set(["capabilities", "screenshots"]);
const AUTHOR_KEYS = new Set(["name", "email", "url"]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
/** Mirror of app isPathInside: child must be at/under parent, no `..` escape. */
function isInside(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** Compact bundled-skill frontmatter check (full depth: create-skill's validate-skill.ts). */
function checkBundledSkill(skillDir: string): string[] {
  const errs: string[] = [];
  const dirName = path.basename(skillDir);
  const skillMd = path.join(skillDir, "SKILL.md");
  let raw: string;
  try {
    raw = readFileSync(skillMd, "utf8");
  } catch {
    return [`bundled skill "${dirName}": missing SKILL.md`];
  }
  const m = raw.match(FRONTMATTER_RE);
  if (!m) return [`bundled skill "${dirName}": no YAML frontmatter`];
  let fm: unknown;
  try {
    fm = Bun.YAML.parse(m[1] ?? "");
  } catch (e) {
    return [`bundled skill "${dirName}": invalid YAML frontmatter (${String(e)})`];
  }
  if (!isPlainObject(fm)) return [`bundled skill "${dirName}": frontmatter must be a mapping`];
  const name = fm.name;
  if (typeof name !== "string" || !NAME_RE.test(name.trim()) || name.trim().length > 64) {
    errs.push(`bundled skill "${dirName}": invalid \`name\``);
  } else if (name.trim() !== dirName) {
    errs.push(`bundled skill "${dirName}": \`name\` "${name.trim()}" must equal directory name`);
  }
  const desc = fm.description;
  if (typeof desc !== "string" || desc.trim().length < 1 || desc.trim().length > 1024) {
    errs.push(`bundled skill "${dirName}": \`description\` must be 1–1024 chars`);
  }
  if (isPlainObject(fm.metadata)) {
    for (const [k, v] of Object.entries(fm.metadata)) {
      if (typeof v !== "string") errs.push(`bundled skill "${dirName}": metadata.${k} must be a string`);
    }
  } else if ("metadata" in fm && fm.metadata !== undefined) {
    errs.push(`bundled skill "${dirName}": \`metadata\` must be a string→string mapping`);
  }
  return errs;
}

function main(): void {
  const target = process.argv[2];
  if (!target) {
    console.error("usage: bun validate-plugin.ts <plugin-root>");
    process.exit(2);
  }
  const root = path.resolve(target);
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    if (!statSync(root).isDirectory()) {
      console.error(`not a directory: ${root}`);
      process.exit(2);
    }
  } catch {
    console.error(`directory not found: ${root}`);
    process.exit(2);
  }

  if (typeof Bun === "undefined" || !(Bun as { YAML?: { parse(s: string): unknown } }).YAML) {
    console.error("Bun.YAML unavailable — run this script with `bun`");
    process.exit(2);
  }

  const manifestPath = path.join(root, ".cowork-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    errors.push(`missing manifest: ${manifestPath} (expected .cowork-plugin/plugin.json)`);
    report(root, errors, warnings);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (e) {
    errors.push(`plugin.json is not valid JSON: ${String(e)}`);
    report(root, errors, warnings);
  }
  if (!isPlainObject(parsed)) {
    errors.push("plugin.json must be a JSON object");
    report(root, errors, warnings);
  }
  const man = parsed as Record<string, unknown>;

  // strict top-level keys
  for (const key of Object.keys(man)) {
    if (!MANIFEST_KEYS.has(key)) {
      errors.push(`unknown key "${key}" — the manifest is strict and rejects unrecognized keys`);
    }
  }

  // name (required)
  if (typeof man.name !== "string") {
    errors.push("`name` is required and must be a string");
  } else if (!NAME_RE.test(man.name.trim())) {
    errors.push(`\`name\` "${man.name.trim()}" must match ${NAME_RE} (kebab-case)`);
  }

  // simple optional strings
  for (const key of ["version", "description", "homepage", "repository", "license"]) {
    if (key in man && man[key] !== undefined && !isNonEmptyString(man[key])) {
      errors.push(`\`${key}\`, if present, must be a non-empty string`);
    }
  }

  // keywords
  if ("keywords" in man && man.keywords !== undefined) {
    if (!Array.isArray(man.keywords) || !man.keywords.every(isNonEmptyString)) {
      errors.push("`keywords`, if present, must be an array of non-empty strings");
    }
  }

  // author
  if ("author" in man && man.author !== undefined) {
    const a = man.author;
    if (typeof a === "string") {
      if (a.trim().length < 1) errors.push("`author` string must be non-empty");
    } else if (isPlainObject(a)) {
      for (const k of Object.keys(a)) {
        if (!AUTHOR_KEYS.has(k)) errors.push(`\`author.${k}\` is not allowed (only name, email, url)`);
        else if (a[k] !== undefined && !isNonEmptyString(a[k])) errors.push(`\`author.${k}\` must be a non-empty string`);
      }
    } else {
      errors.push("`author` must be a string or an object {name?, email?, url?}");
    }
  }

  // skills value shape
  if ("skills" in man && man.skills !== undefined) {
    const s = man.skills;
    const ok = isNonEmptyString(s) || (Array.isArray(s) && s.every(isNonEmptyString));
    if (!ok) errors.push("`skills`, if present, must be a path string or array of path strings");
  }

  // mcpServers / apps must be path strings
  if ("mcpServers" in man && man.mcpServers !== undefined && typeof man.mcpServers !== "string") {
    errors.push("`mcpServers` must be a path string to a .mcp.json, not an inline object (see references/mcp-and-apps.md)");
  }
  if ("apps" in man && man.apps !== undefined && typeof man.apps !== "string") {
    errors.push("`apps` must be a path string to a .app.json");
  }

  // interface
  if ("interface" in man && man.interface !== undefined) {
    if (!isPlainObject(man.interface)) {
      errors.push("`interface`, if present, must be an object");
    } else {
      for (const [k, v] of Object.entries(man.interface)) {
        if (INTERFACE_STRING_KEYS.has(k)) {
          if (!isNonEmptyString(v)) errors.push(`\`interface.${k}\` must be a non-empty string`);
        } else if (INTERFACE_ARRAY_KEYS.has(k)) {
          if (!Array.isArray(v) || !v.every(isNonEmptyString)) errors.push(`\`interface.${k}\` must be an array of non-empty strings`);
        } else if (k === "defaultPrompt") {
          if (!isNonEmptyString(v) && !(Array.isArray(v) && v.every(isNonEmptyString))) {
            errors.push("`interface.defaultPrompt` must be a string or array of strings");
          }
        } else {
          errors.push(`\`interface.${k}\` is not an allowed interface key`);
        }
      }
    }
  }

  // path resolution + inside-root + bundled skills
  const skillsDeclared = "skills" in man && man.skills !== undefined;
  const skillsValues = Array.isArray(man.skills)
    ? (man.skills as string[])
    : typeof man.skills === "string"
      ? [man.skills]
      : ["./skills/"];
  for (const rel of skillsValues) {
    if (typeof rel !== "string") continue;
    const abs = path.resolve(root, rel);
    if (!isInside(root, abs)) {
      errors.push(`\`skills\` path "${rel}" resolves outside the plugin root`);
      continue;
    }
    const exists = existsSync(abs);
    if (skillsDeclared && !exists) {
      errors.push(`declared \`skills\` path "${rel}" does not exist`);
      continue;
    }
    if (exists && statSync(abs).isDirectory()) {
      for (const entry of readdirSync(abs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const skillDir = path.join(abs, entry.name);
        if (!existsSync(path.join(skillDir, "SKILL.md"))) {
          warnings.push(`skills/${entry.name} has no SKILL.md — it bundles no skill`);
          continue;
        }
        errors.push(...checkBundledSkill(skillDir));
      }
    }
  }
  for (const [key, def] of [["mcpServers", "./.mcp.json"], ["apps", "./.app.json"]] as const) {
    const rel = typeof man[key] === "string" ? (man[key] as string) : def;
    const abs = path.resolve(root, rel);
    if (!isInside(root, abs)) errors.push(`\`${key}\` path "${rel}" resolves outside the plugin root`);
    else if (typeof man[key] === "string" && !existsSync(abs)) warnings.push(`\`${key}\` path "${rel}" does not exist yet`);
  }

  report(root, errors, warnings);
}

function report(root: string, errors: string[], warnings: string[]): never {
  console.log(`Validating plugin: ${root}`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  if (errors.length > 0) {
    console.log(`FAIL — ${errors.length} error(s); the loader would reject this plugin`);
    process.exit(1);
  }
  console.log("PASS — the loader will accept this plugin");
  process.exit(0);
}

main();
