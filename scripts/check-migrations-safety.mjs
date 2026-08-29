// Static security scan of supabase/migrations — catches the exact regression
// class the Supabase linter flags, at the source, without needing DB access:
// a CREATE TABLE in the public schema without a matching ENABLE ROW LEVEL
// SECURITY, or without a GRANT. Runs in CI before launch.
//
// Exit code 1 if any violation is found. Prints a structured report.

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

function extractCreateTables(sql) {
  // Find "CREATE TABLE [IF NOT EXISTS] public.<name> (" ... matching ")".
  const tables = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.("?[a-z_][a-z0-9_]*"?)\s*\(/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const name = m[1].replace(/"/g, "");
    tables.push({ name, index: m.index });
  }
  return tables;
}

function scanFile(file) {
  const sql = readFileSync(file, "utf8");
  const tables = extractCreateTables(sql);
  const issues = [];
  for (const t of tables) {
    const hasRls = new RegExp(`ALTER\\s+TABLE\\s+public\\.${t.name}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, "i").test(sql);
    const hasGrant = new RegExp(`GRANT\\s+[^;]+\\s+ON\\s+public\\.${t.name}\\s+TO`, "i").test(sql);
    if (!hasRls) issues.push({ file, table: t.name, rule: "rls_missing", severity: "error" });
    if (!hasGrant) issues.push({ file, table: t.name, rule: "grant_missing", severity: "error" });
  }
  // Flag SECURITY DEFINER functions granted to anon without an internal has_role guard.
  const fnRe = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.("?[a-z_][a-z0-9_]*"?)\s*\([^)]*\)[\s\S]*?SECURITY\s+DEFINER/gi;
  let fm;
  while ((fm = fnRe.exec(sql)) !== null) {
    const fname = fm[1].replace(/"/g, "");
    const body = fm[0];
    const grantsAnon = new RegExp(`GRANT\\s+EXECUTE\\s+ON\\s+(?:FUNCTION\\s+)?public\\.${fname}\\s+TO\\s+anon`, "i").test(sql);
    const hasGuard = /has_role\s*\(/i.test(body);
    if (grantsAnon && !hasGuard) {
      issues.push({ file, table: fname, rule: "anon_security_definer_no_guard", severity: "warn" });
    }
  }
  return issues;
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

  const allIssues = [];
  for (const f of files) allIssues.push(...scanFile(f));

  if (allIssues.length === 0) {
    console.log(`${DIM}migrations safety: ${files.length} files scanned, no violations${RESET}`);
    process.exit(0);
  }

  const errors = allIssues.filter((i) => i.severity === "error");
  const warns = allIssues.filter((i) => i.severity === "warn");

  for (const i of allIssues) {
    const color = i.severity === "error" ? FAIL : WARN;
    console.log(`${color}[${i.severity}]${RESET} ${i.rule} on public.${i.table} in ${i.file}`);
  }
  console.log(`\n${errors.length ? FAIL : DIM}${errors.length} error(s), ${warns.length} warning(s)${RESET}`);
  process.exit(errors.length ? 1 : 0);
}

main();
