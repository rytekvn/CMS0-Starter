// Check cho chinh cong cu: pnpm test (hoac `node --test scripts/`).
// Fixture dung tay trong bo nho, KHONG doc spec/ that — spec that doi theo thoi
// gian, test se ra gion ma khong bat them duoc loi nao cua script.
import assert from "node:assert/strict";
import { checkEntity, parseHeadings, specPaths } from "./check-spec.mjs";

// --- parseHeadings ---

// Dong **Test:** ngay duoi heading (dang file that) va cach mot dong trong
// (dang template) deu duoc nhan; dong "###" khong phai heading muc 2.
assert.deepEqual(
  parseHeadings("# T\n\n## [AC-X-01] A\n**Test:** ngay duoi\n- Given\n\n## [AC-X-02] B\n\n**Test:** cach dong trong\n"),
  [
    { line: 3, heading: "[AC-X-01] A", testLine: "ngay duoi" },
    { line: 7, heading: "[AC-X-02] B", testLine: "cach dong trong" },
  ],
);

// **Test:** khong phai dong noi dung dau tien -> khong tinh (tranh nhan nham
// dong **Test:** cua heading ke tiep lam cua heading nay).
assert.deepEqual(parseHeadings("## [AC-X-01] A\n- Given\n**Test:** muon\n"), [
  { line: 1, heading: "[AC-X-01] A", testLine: null },
]);

// --- checkEntity ---

const ok = `# Acceptance — Tag

## [AC-TAG-01] Chung
**Test:** chua co, se verify thu cong luc implement
- **Given** khong co token **Then** 401

## [AC-TAG-02] GET /tags (\`tag.read\`)
**Test:** mot phan — \`apps/api/tag.test.ts\` (chi test Zod)

## Out of scope (chua co)
- khong co AC-ID, khong can **Test:**
`;

const files = (acceptance) => ({ entity: "entity: Tag", permission: "entity: Tag", acceptance });
const exists = (p) => p === "apps/api/tag.test.ts";

assert.deepEqual(checkEntity("tag", files(ok), exists), []);

// Thieu file -> bao du ca 2, va van kiem tiep file acceptance con lai.
assert.deepEqual(
  checkEntity("tag", { entity: null, permission: null, acceptance: ok }, exists),
  ["thieu spec/entities/tag.yaml", "thieu spec/permissions/tag.yaml"],
);

// Thieu acceptance -> dung lai, khong bao them loi heading ao.
assert.deepEqual(checkEntity("tag", { entity: "x", permission: "x", acceptance: null }, exists), [
  "thieu spec/acceptance/tag.feature.md",
]);

// Moi loi cau truc bat duoc: thieu ID, sai ten entity trong ID, trung ID,
// thieu dong **Test:**, va **Test:** tro toi file khong ton tai.
const bad = `## Chung
**Test:** chua co

## [AC-PRODUCT-02] Sai ten entity
**Test:** chua co

## [AC-TAG-03] Trung
**Test:** chua co

## [AC-TAG-03] Trung lan hai
**Test:** chua co

## [AC-TAG-04] Thieu dong Test
- **Given** gi do

## [AC-TAG-05] Tro file ma
**Test:** \`apps/api/khong-ton-tai.test.ts\`
`;

assert.deepEqual(checkEntity("tag", files(bad), exists), [
  'spec/acceptance/tag.feature.md:1: heading thieu ID dang [AC-TAG-NN] — "Chung"',
  "spec/acceptance/tag.feature.md:4: ID la [AC-PRODUCT-02], phai la [AC-TAG-02]",
  "spec/acceptance/tag.feature.md:10: ID [AC-TAG-03] trung voi dong 7",
  "spec/acceptance/tag.feature.md:13: thieu dong **Test:** ngay duoi heading",
  "spec/acceptance/tag.feature.md:16: **Test:** tro toi `apps/api/khong-ton-tai.test.ts` nhung file khong ton tai",
]);

// --- specPaths ---
assert.deepEqual(specPaths("tag"), {
  entity: "spec/entities/tag.yaml",
  permission: "spec/permissions/tag.yaml",
  acceptance: "spec/acceptance/tag.feature.md",
});
