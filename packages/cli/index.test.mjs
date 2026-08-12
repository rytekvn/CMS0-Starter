import assert from "node:assert/strict";
import test from "node:test";

import {
  checkDisk,
  checkNode,
  dbName,
  filesToCopy,
  replaceSection,
  rewriteClaudeMd,
  rewriteFile,
  rewriteRootPkg,
  validateName,
} from "./index.mjs";

test("validateName nhan ten hop le, tu choi ten sinh thu muc/DB sai", () => {
  for (const ok of ["my-shop", "acme", "a", "shop2", "a-b-c1"]) {
    assert.equal(validateName(ok), true, ok);
  }
  for (const bad of ["My-Shop", "2shop", "-shop", "shop-", "my shop", "my_shop", "my.shop", "", "a".repeat(51)]) {
    assert.equal(validateName(bad), false, bad);
  }
});

test("dbName doi - thanh _ (Postgres khong nhan dau - trong ten db khong quote)", () => {
  assert.equal(dbName("my-shop"), "my_shop");
  assert.equal(dbName("a-b-c"), "a_b_c");
  assert.equal(dbName("acme"), "acme");
});

test("filesToCopy loai dung 3 prefix, giu phan con lai nguyen thu tu", () => {
  const input = [
    ".gitignore",
    "CLAUDE.md",
    "README.md",
    "apps/api/src/main.ts",
    "package.json",
    "packages/cli/index.mjs",
    "packages/cli/templates/README.md",
    "pnpm-lock.yaml",
    "spec/README.md",
  ];
  assert.deepEqual(filesToCopy(input), [
    ".gitignore",
    "CLAUDE.md",
    "apps/api/src/main.ts",
    "package.json",
    "spec/README.md",
  ]);
});

test("rewriteRootPkg doi name, xoa scripts.cli, GIU packageManager", () => {
  const src = JSON.stringify(
    {
      name: "rytek-platform",
      version: "0.3.0",
      private: true,
      packageManager: "pnpm@10.34.5",
      scripts: { lint: "oxlint apps packages", cli: "node packages/cli/index.mjs", build: "pnpm -r build" },
    },
    null,
    2
  );
  const pkg = JSON.parse(rewriteRootPkg(src, "my-shop"));
  assert.equal(pkg.name, "my-shop");
  assert.equal(pkg.scripts.cli, undefined);
  assert.equal(pkg.scripts.build, "pnpm -r build");
  // Mat field nay -> corepack tai pnpm moi nhat (doi Node >=22.13) -> du an chet.
  assert.equal(pkg.packageManager, "pnpm@10.34.5");
});

test("replaceSection thay giua file, xoa cuoi file, throw khi thieu heading", () => {
  const md = ["# Title", "", "## A", "", "noi dung a", "", "## B", "", "noi dung b", ""].join("\n");

  assert.equal(replaceSection(md, "## A", "## A\n\nmoi\n"), ["# Title", "", "## A", "", "moi", "", "## B", "", "noi dung b", ""].join("\n"));
  assert.equal(replaceSection(md, "## B", ""), ["# Title", "", "## A", "", "noi dung a", ""].join("\n"));
  assert.equal(replaceSection(md, "## A", ""), ["# Title", "", "## B", "", "noi dung b", ""].join("\n"));
  assert.throws(() => replaceSection(md, "## Khong Co", ""), /khong tim thay heading/);
});

test("rewriteFile: doi dung 2 cho cms_starter, file ngoai bang tra nguyen van", () => {
  const compose = ["    POSTGRES_DB: cms_starter", '      test: ["CMD-SHELL", "pg_isready -U postgres -d cms_starter"]'].join("\n");
  assert.equal(
    rewriteFile("docker-compose.yml", compose, "my-shop"),
    ["    POSTGRES_DB: my_shop", '      test: ["CMD-SHELL", "pg_isready -U postgres -d my_shop"]'].join("\n")
  );

  assert.equal(
    rewriteFile("apps/api/.env.example", 'DATABASE_URL="postgresql://p:p@localhost:5432/cms_starter?schema=public"', "my-shop"),
    'DATABASE_URL="postgresql://p:p@localhost:5432/my_shop?schema=public"'
  );
  assert.equal(
    rewriteFile("apps/api/src/common/swagger.ts", '    .setTitle("Rytek Platform API")', "my-shop"),
    '    .setTitle("my-shop API")'
  );
  assert.equal(
    rewriteFile(".claude/skills/new-entity/SKILL.md", "description: ... cua Rytek Platform, dien san ...", "my-shop"),
    "description: ... cua my-shop, dien san ..."
  );

  const untouched = "const db = 'cms starter';\n";
  assert.equal(rewriteFile("apps/api/src/seed.ts", untouched, "my-shop"), untouched);
});

test("rewriteClaudeMd: H1 moi, Project Context moi, khong con Release Process/CLI", () => {
  const md = [
    "# CLAUDE.md — Rytek Platform",
    "",
    "## Project Context",
    "",
    "Day khong phai mot CMS don le.",
    "",
    "## Architecture Rules",
    "",
    "- Chi service goi Prisma.",
    "",
    "## CLI",
    "",
    "pnpm cli create <path>",
    "",
    "## Release Process",
    "",
    "- v0.7 — CLI.",
    "",
  ].join("\n");
  const out = rewriteClaudeMd(md, "my-shop");

  assert.equal(out.split("\n")[0], "# CLAUDE.md — my-shop");
  assert.match(out, /## Project Context/);
  assert.doesNotMatch(out, /Day khong phai mot CMS don le/);
  assert.match(out, /- Chi service goi Prisma\./); // section giu nguyen khong bi cat lay
  assert.doesNotMatch(out, /## Release Process/);
  assert.doesNotMatch(out, /## CLI/);
  assert.throws(() => rewriteClaudeMd("khong co H1\n", "my-shop"), /H1/);
});

test("checkNode / checkDisk dung nguong", () => {
  assert.equal(checkNode("v20.10.0").level, "FAIL");
  assert.equal(checkNode("v18.20.0").level, "FAIL");
  assert.equal(checkNode("v20.11.0").level, "WARN");
  assert.equal(checkNode("v21.7.3").level, "WARN");
  assert.equal(checkNode("v22.6.0").level, "OK");
  assert.equal(checkNode("24.0.0").level, "OK");

  assert.equal(checkDisk(1.9 * 1024 ** 3).level, "FAIL");
  assert.equal(checkDisk(4.9 * 1024 ** 3).level, "WARN");
  assert.equal(checkDisk(5 * 1024 ** 3).level, "OK");
  assert.match(checkDisk(10 * 1024 ** 3).message, /10\.0 GiB/);
});
