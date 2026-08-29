// Static security scan of supabase/migrations — catches the exact regression
// class the Supabase linter flags, at the source, without needing DB access:
// a CREATE TABLE in the public schema that never gets ENABLE ROW LEVEL
// SECURITY, or never gets a GRANT, across the entire migration corpus.
//
// Aggregates across all files: a table created in migration A and granted in
// migration B is fine. A table that is created but never granted or never
// RLS-enabled anywhere is a real regression. SECURITY DEFINER functions
// granted to anon without an internal has_role guard are flagged as warnings.
//
// Exit code 1 if any error is found. Prints a structured report.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = new URL("../supabase/migrations", import.meta.url).pathname;
const FAIL = "\x1b[31m";
const WARN = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function listSqlFiles(dir) {
  let out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(listSqlFiles(full));
    else if (entry.endsWith(".sql")) out.push(full);
  }
  return out.sort();
}

function findMatches(sql, re) {
  const out = [];
  let m;
  while ((m = re.exec(sql)) !== null) out.push(m);
  return out;
}

function main() {
  let files;
  try {
    files = listSqlFiles(MIGRATIONS_DIR);
  } catch {
    console.log(`${DIM}no supabase/migrations directory — skipping${RESET}`);
    process.exit(0);
  }
  if (files.length === 0) {
    console.log(`${DIM}no migration files found — skipping${RESET}`);
    process.exit(0);
  }

  // Aggregate every CREATE TABLE / GRANT / ENABLE RLS across the whole corpus.
  const created = new Map(); // tableName -> first file
  const rlsEnabled = new Set();
  const granted = new Set();
  const definerFns = new Map(); // fnName -> first file
  const anonExecFns = new Set();

  for (const file of files) {
    const sql = readFileSync(file, "utf8");
    for (const m of findMatches(sql, /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.("?[a-z_][a-z0-9_]*"?)\s*\(/gi)) {
      const name = m[1].replace(/"/g, "");
      if (!created.has(name)) created.set(name, file);
    }
    for (const m of findMatches(sql, /ALTER\s+TABLE\s+public\.("?[a-z_][a-z0-9_]*"?)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi)) {
      rlsEnabled.add(m[1].replace(/"/g, ""));
    }
    for (const m of findMatches(sql, /GRANT\s+[^;]+?\s+ON\s+public\.("?[a-z_][a-z0-9_]*"?)\s+TO/gi)) {
      granted.add(m[1].replace(/"/g, ""));
    }
    for (const m of findMatches(sql, /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.("?[a-z_][a-z0-9_]*"?)\s*\([^)]*\)[\s\S]*?SECURITY\s+DEFINER/gi)) {
      const name = m[1].replace(/"/g, "");
      if (!definerFns.has(name)) definerFns.set(name, file);
    }
    for (const m of findMatches(sql, /GRANT\s+EXECUTE\s+ON\s+(?:FUNCTION\s+)?public\.("?[a-z_][a-z0-9_]*"?)\s+TO\s+anon/gi)) {
      anonExecFns.add(m[1].replace(/"/g, ""));
    }
  }

  const issues = [];
  for (const [name, file] of created) {
    if (!rlsEnabled.has(name)) issues.push({ file, table: name, rule: "rls_missing", severity: "error" });
    if (!granted.has(name)) issues.push({ file, table: name, rule: "grant_missing", severity: "error" });
  }
  // SECURITY DEFINER granted to anon: flag if the function body (best effort)
  // lacks a has_role guard. We re-scan the definer function body for has_role.
  for (const [name, file] of definerFns) {
    if (!anonExecFns.has(name)) continue;
    const sql = readFileSync(file, "utf8");
    const bodyRe = new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+public\\.${name}\\s*\\([^)]*\\)[\\s\\S]*?\\$\\$`, "i");
    const bm = bodyRe.exec(sql);
    const hasGuard = bm ? /has_role\s*\(/i.test(bm[0]) : false;
    if (!hasGuard) issues.push({ file, table: name, rule: "anon_security_definer_no_guard", severity: "warn" });
  }

  if (issues.length === 0) {
    console.log(`${DIM}migrations safety: ${files.length} files, ${created.size} tables — no violations${RESET}`);
    process.exit(0);
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  for (const i of issues) {
    const color = i.severity === "error" ? FAIL : WARN;
    console.log(`${color}[${i.severity}]${RESET} ${i.rule} on public.${i.table} (created in ${i.file})`);
  }
  console.log(`\n${errors.length ? FAIL : DIM}${errors.length} error(s), ${warns.length} warning(s)${RESET}`);
  process.exit(errors.length ? 1 : 0);
}

main();
