#!/usr/bin/env node
// Kiem CAU TRUC spec cua mot entity (Definition of Ready, phan kiem duoc tu dong).
// Chay tay: `pnpm spec:check [entity]` — khong co arg = kiem moi entity.
// KHONG phai CI gate: script chi kiem su ton tai/hinh dang, khong kiem ngu nghia.
//
// Khong parse YAML thanh AST: cac check deu o muc "file co ton tai", "heading co
// dung dang" — regex/string du, them dependency YAML chi de doc 3 file la thua.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const AC_ID = /^\[AC-([A-Z0-9]+)-(\d{2})\]/;
// Duong dan file trong dong **Test:** luon nam trong backtick (quy uoc spec/README.md).
const TEST_FILE_REF = /`([^`]+\.(?:ts|tsx|js|mjs|cjs))`/g;

export function specPaths(name) {
  return {
    entity: `spec/entities/${name}.yaml`,
    permission: `spec/permissions/${name}.yaml`,
    acceptance: `spec/acceptance/${name}.feature.md`,
  };
}

/**
 * Cat moi heading `##` cua file acceptance kem dong **Test:** cua no.
 * testLine = null khi dong noi dung DAU TIEN sau heading khong phai **Test:**
 * (dong trong duoc bo qua — template co dong trong, file that thi khong).
 */
export function parseHeadings(md) {
  const lines = md.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('## ')) continue;
    let testLine = null;
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j].trim();
      if (l === '') continue;
      if (l.startsWith('**Test:**')) testLine = l.slice('**Test:**'.length).trim();
      break;
    }
    out.push({ line: i + 1, heading: lines[i].slice(3).trim(), testLine });
  }
  return out;
}

/**
 * @param {string} name         ten entity, vd "product"
 * @param {{entity:?string, permission:?string, acceptance:?string}} files
 *        noi dung 3 file (null = khong ton tai)
 * @param {(p: string) => boolean} fileExists  kiem file test duoc tro toi co that khong
 * @returns {string[]} danh sach loi, rong = dat
 */
export function checkEntity(name, files, fileExists) {
  const errors = [];
  const paths = specPaths(name);
  for (const kind of ['entity', 'permission', 'acceptance']) {
    if (files[kind] == null) errors.push(`thieu ${paths[kind]}`);
  }
  if (files.acceptance == null) return errors;

  const expected = name.toUpperCase();
  const seen = new Map();
  for (const { line, heading, testLine } of parseHeadings(files.acceptance)) {
    if (heading.startsWith('Out of scope')) continue;
    const where = `${paths.acceptance}:${line}`;

    const m = AC_ID.exec(heading);
    if (!m) {
      errors.push(`${where}: heading thieu ID dang [AC-${expected}-NN] — "${heading}"`);
    } else {
      if (m[1] !== expected) errors.push(`${where}: ID la [AC-${m[1]}-${m[2]}], phai la [AC-${expected}-${m[2]}]`);
      const id = m[0];
      if (seen.has(id)) errors.push(`${where}: ID ${id} trung voi dong ${seen.get(id)}`);
      else seen.set(id, line);
    }

    if (testLine == null) {
      errors.push(`${where}: thieu dong **Test:** ngay duoi heading`);
      continue;
    }
    for (const [, ref] of testLine.matchAll(TEST_FILE_REF)) {
      if (!fileExists(ref)) errors.push(`${where}: **Test:** tro toi \`${ref}\` nhung file khong ton tai`);
    }
  }
  return errors;
}

function readOrNull(rel) {
  const abs = path.join(ROOT, rel);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
}

function main() {
  const arg = process.argv[2];
  const names = arg
    ? [arg]
    : readdirSync(path.join(ROOT, 'spec/entities'))
        .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
        .map((f) => f.replace(/\.yaml$/, ''))
        .sort();

  if (names.length === 0) {
    console.error('Khong tim thay entity nao trong spec/entities/');
    process.exit(1);
  }

  let failed = 0;
  for (const name of names) {
    const paths = specPaths(name);
    const files = {
      entity: readOrNull(paths.entity),
      permission: readOrNull(paths.permission),
      acceptance: readOrNull(paths.acceptance),
    };
    const errors = checkEntity(name, files, (p) => existsSync(path.join(ROOT, p)));
    if (errors.length === 0) {
      console.log(`OK   ${name}`);
    } else {
      failed++;
      console.log(`FAIL ${name}`);
      for (const e of errors) console.log(`       ${e}`);
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) main();
