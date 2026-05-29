#!/usr/bin/env bun
/**
 * validate-skill.ts — check that a directory is a valid skill.
 *
 * Reproduces the rules the loader applies to every SKILL.md: the frontmatter must parse as a YAML
 * mapping; `name` is kebab-case, ≤64 chars, and equals the directory name; `description` is 1–1024
 * chars; optional `metadata` is a string→string map; optional `compatibility` is ≤500 chars. A PASS
 * means the skill will be discovered and loaded. See ../references/schema.md for the full rule set.
 *
 * Usage:  bun validate-skill.ts <skill-directory>
 * Exit:   0 = valid, 1 = invalid, 2 = usage/IO error.
 */
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Identical to catalog.ts splitFrontMatter().
const FRONTMATTER_RE = /^﻿?---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;
// Keys the loader recognizes. Any others are kept but ignored — warn so typos surface.
const KNOWN_KEYS = ["name", "description", "license", "compatibility", "metadata", "allowed-tools", "triggers"];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Validate one skill directory. Returns {errors, warnings, name}. Pure — callers print. */
export function validateSkillDir(dir: string): {
  errors: string[];
  warnings: string[];
  name?: string;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const dirName = path.basename(dir);

  let st: ReturnType<typeof statSync>;
  try {
    st = statSync(dir);
  } catch {
    return { errors: [`directory not found: ${dir}`], warnings };
  }
  if (!st.isDirectory()) return { errors: [`not a directory: ${dir}`], warnings };

  const skillMd = path.join(dir, "SKILL.md");
  let raw: string;
  try {
    raw = readFileSync(skillMd, "utf8");
  } catch {
    return { errors: [`missing SKILL.md (expected ${skillMd})`], warnings };
  }

  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    errors.push("no YAML frontmatter — file must start with a `---` fenced block");
    return { errors, warnings };
  }

  if (typeof Bun === "undefined" || !(Bun as { YAML?: { parse(s: string): unknown } }).YAML) {
    return { errors: ["Bun.YAML unavailable — run this script with `bun` (the app's YAML parser)"], warnings };
  }

  let fm: unknown;
  try {
    fm = Bun.YAML.parse(match[1] ?? "");
  } catch (e) {
    errors.push(`frontmatter is not valid YAML: ${String(e)}`);
    return { errors, warnings };
  }
  if (!isPlainObject(fm)) {
    errors.push("frontmatter must be a YAML mapping (key: value pairs)");
    return { errors, warnings };
  }

  // name (required)
  const name = fm.name;
  if (typeof name !== "string") {
    errors.push("`name` is required and must be a string");
  } else {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 64) {
      errors.push(`\`name\` must be 1–64 chars (got ${trimmed.length})`);
    }
    if (!NAME_RE.test(trimmed)) {
      errors.push(`\`name\` "${trimmed}" must match ${NAME_RE} (lowercase, hyphen-separated)`);
    }
    if (trimmed !== dirName) {
      errors.push(`\`name\` "${trimmed}" must equal the directory name "${dirName}"`);
    }
  }

  // description (required)
  const description = fm.description;
  if (typeof description !== "string") {
    errors.push("`description` is required and must be a string");
  } else {
    const len = description.trim().length;
    if (len < 1 || len > 1024) errors.push(`\`description\` must be 1–1024 chars (got ${len})`);
  }

  // license (optional)
  if ("license" in fm && fm.license !== undefined) {
    if (typeof fm.license !== "string" || fm.license.trim().length < 1) {
      errors.push("`license`, if present, must be a non-empty string");
    }
  }

  // compatibility (optional, <=500)
  if ("compatibility" in fm && fm.compatibility !== undefined) {
    if (typeof fm.compatibility !== "string") {
      errors.push("`compatibility`, if present, must be a string");
    } else {
      const len = fm.compatibility.trim().length;
      if (len < 1 || len > 500) errors.push(`\`compatibility\` must be 1–500 chars (got ${len})`);
    }
  }

  // metadata (optional, Record<string,string>)
  if ("metadata" in fm && fm.metadata !== undefined) {
    if (!isPlainObject(fm.metadata)) {
      errors.push("`metadata`, if present, must be a mapping of string → string");
    } else {
      for (const [k, v] of Object.entries(fm.metadata)) {
        if (typeof v !== "string") {
          errors.push(`\`metadata.${k}\` must be a string (got ${typeof v}); quote it if numeric`);
        }
      }
    }
  }

  // allowed-tools (optional)
  if ("allowed-tools" in fm && fm["allowed-tools"] !== undefined) {
    if (typeof fm["allowed-tools"] !== "string" || fm["allowed-tools"].trim().length < 1) {
      errors.push("`allowed-tools`, if present, must be a non-empty string");
    }
  }

  // triggers shape (non-fatal — extractTriggers just ignores bad shapes)
  const triggers = fm.triggers ?? (isPlainObject(fm.metadata) ? fm.metadata.triggers : undefined);
  if (triggers !== undefined && typeof triggers !== "string" && !Array.isArray(triggers)) {
    warnings.push("`triggers` should be a comma-separated string or an array; it will be ignored");
  }

  for (const key of Object.keys(fm)) {
    if (!KNOWN_KEYS.includes(key)) warnings.push(`unrecognized key "${key}" — ignored by the loader`);
  }

  return { errors, warnings, name: typeof name === "string" ? name.trim() : undefined };
}

function main(): void {
  const target = process.argv[2];
  if (!target) {
    console.error("usage: bun validate-skill.ts <skill-directory>");
    process.exit(2);
  }
  const dir = path.resolve(target);
  const { errors, warnings, name } = validateSkillDir(dir);

  console.log(`Validating skill: ${dir}`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  for (const e of errors) console.log(`  ✗ ${e}`);

  if (errors.length > 0) {
    console.log(`FAIL — ${errors.length} error(s); the loader would reject this skill`);
    process.exit(1);
  }
  console.log(`PASS — "${name}" will be accepted by the loader`);
  process.exit(0);
}

if (import.meta.main) main();
