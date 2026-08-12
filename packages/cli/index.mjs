#!/usr/bin/env node
// CLI cua starter: `rytek create <path>` sinh du an moi tu chinh repo nay,
// `rytek doctor` kiem may co du dieu kien chay du an khong.
//
// Zero dependency (chi node: builtins) — CLI chi co 2 subcommand va mot tham so
// positional, khong dang de keo commander/prompts vao.
//
// Nguon danh sach file copy la `git ls-files`, KHONG phai cpSync + exclude tu
// viet: .gitignore da loai dung node_modules/dist/.next/.env/uploads/
// settings.local.json. Viet lai pattern = viet lai .gitignore lan hai, moi file
// local moi cua nguoi dung sau nay la mot lan ro ri.
// Danh doi: `create` chi sinh dung tu trang thai da commit (xem ADR-0003).
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statfsSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");

// 3 prefix khong di theo du an sinh ra:
// - pnpm-lock.yaml: du an moi tu resolve, khong ke thua resolution cu
// - packages/: san pham khong can cong cu tu sinh san pham (tranh tu nhan ban)
// - README.md: README cua starter co lich su rieng -> ghi tu templates/
const SKIP_PREFIXES = ["pnpm-lock.yaml", "packages/", "README.md"];

const GiB = 1024 ** 3;

export function validateName(name) {
  return /^[a-z][a-z0-9-]*$/.test(name) && name.length <= 50 && !name.endsWith("-");
}

export function dbName(name) {
  return name.replaceAll("-", "_");
}

export function filesToCopy(files) {
  return files.filter((f) => !SKIP_PREFIXES.some((p) => f === p || f.startsWith(p)));
}

export function rewriteRootPkg(json, name) {
  const pkg = JSON.parse(json);
  pkg.name = name;
  // `cli` tro toi packages/cli — thu muc khong duoc copy sang du an moi.
  delete pkg.scripts.cli;
  // KHONG dung `packageManager`: thieu field nay, corepack tu tai pnpm moi nhat
  // (pnpm 11 doi Node >=22.13) va du an chet ngay lenh install dau tien.
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

/**
 * Thay (hoac xoa, khi `replacement` rong) mot section cap `##` cua file markdown.
 * Throw khi khong tim thay heading: CLAUDE.md dieu khien hanh vi cua agent, mot
 * lan doi ten heading ma rewrite lang le bo qua la du an sinh ra mang theo
 * section sai ngu canh ma khong ai biet.
 */
export function replaceSection(md, heading, replacement) {
  const lines = md.split("\n");
  const start = lines.indexOf(heading);
  if (start === -1) throw new Error(`khong tim thay heading "${heading}"`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  const body = replacement === "" ? [] : [...replacement.trimEnd().split("\n"), ""];
  return `${[...lines.slice(0, start), ...body, ...lines.slice(end)].join("\n").trimEnd()}\n`;
}

const NEW_PROJECT_CONTEXT = `## Project Context

Du an nay sinh tu **Rytek starter** (\`rytek create\`): NestJS + Next.js +
Prisma/PostgreSQL + Redis, phat trien theo Spec-Driven Development.

Module mau (auth, user, role, file, product) duoc giu nguyen lam vi du song —
sua hoac xoa theo nghiep vu that cua du an, dung coi la khung bat kha xam pham.

\`\`\`
apps/api             NestJS  :4000   auth (login/me), user, role, file, product;
                                     cache auth qua Redis + queue BullMQ (worker in-process)
apps/admin-web       Next.js :3000   /login, /products, /users, /roles
prisma/              schema.prisma - single source of truth cho DB
spec/                contract nghiep vu da duyet
docs/                roadmap platform (tham chieu tu starter)
\`\`\`

Ly do chon stack va cac phuong an da loai:
\`spec/decisions/ADR-0001-nestjs-nextjs-pnpm-monorepo.md\`.`;

export function rewriteClaudeMd(md, name) {
  const lines = md.split("\n");
  if (!lines[0].startsWith("# ")) throw new Error("CLAUDE.md khong bat dau bang heading H1");
  lines[0] = `# CLAUDE.md — ${name}`;
  let out = replaceSection(lines.join("\n"), "## Project Context", NEW_PROJECT_CONTEXT);
  // Release Process + CLI la chuyen rieng cua starter, khong phai cua du an sinh ra.
  out = replaceSection(out, "## CLI", "");
  return replaceSection(out, "## Release Process", "");
}

// Bang doi ten: chi 6 file nay doi noi dung, moi file con lai copy nguyen byte.
const REWRITES = {
  "package.json": rewriteRootPkg,
  "docker-compose.yml": (c, name) => c.replaceAll("cms_starter", dbName(name)),
  "apps/api/.env.example": (c, name) => c.replaceAll("cms_starter", dbName(name)),
  "apps/api/src/common/swagger.ts": (c, name) => c.replace('"Rytek Platform API"', `"${name} API"`),
  ".claude/skills/new-entity/SKILL.md": (c, name) => c.replaceAll("Rytek Platform", name),
  "CLAUDE.md": rewriteClaudeMd,
};

export function rewriteFile(rel, content, name) {
  return REWRITES[rel] ? REWRITES[rel](content, name) : content;
}

export function checkNode(version) {
  const [major, minor] = version.replace(/^v/, "").split(".").map(Number);
  if (major < 20 || (major === 20 && minor < 11)) {
    return { level: "FAIL", message: `Node ${version} — can >=20.11 (Next.js 15 + NestJS 11)` };
  }
  if (major < 22) return { level: "WARN", message: `Node ${version} — nen dung >=22 (LTS hien tai)` };
  return { level: "OK", message: `Node ${version}` };
}

export function checkDisk(freeBytes) {
  const gib = (freeBytes / GiB).toFixed(1);
  if (freeBytes < 2 * GiB) return { level: "FAIL", message: `Con ${gib} GiB trong — can >=2 GiB cho node_modules` };
  if (freeBytes < 5 * GiB) return { level: "WARN", message: `Con ${gib} GiB trong — hoi sat, node_modules ~1 GiB` };
  return { level: "OK", message: `Con ${gib} GiB trong` };
}

function die(message) {
  console.error(`Loi: ${message}`);
  process.exit(1);
}

function cmdCreate(target) {
  if (!target) die("thieu duong dan. Vd: rytek create ../my-shop");

  // `pnpm run` doi cwd thanh root workspace -> khong resolve theo cwd, neu khong
  // `pnpm cli create my-shop` go trong starter se de du an moi ngay giua starter.
  const dest = path.resolve(process.env.INIT_CWD || process.cwd(), target);
  const name = path.basename(dest);

  if (!validateName(name)) {
    die(`ten "${name}" khong hop le. Chi chu thuong/so/dau -, bat dau bang chu (vd my-shop).`);
  }
  const inside = path.relative(ROOT, dest);
  if (dest === ROOT || (inside && !inside.startsWith("..") && !path.isAbsolute(inside))) {
    die(`khong tao du an moi ben trong chinh starter (${ROOT}). Chon duong dan ngoai, vd ../${name}.`);
  }
  if (existsSync(dest) && readdirSync(dest).length > 0) die(`${dest} da ton tai va khong rong.`);

  let files;
  try {
    files = filesToCopy(
      execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", timeout: 30000 })
        .split("\0")
        .filter(Boolean)
    );
  } catch (err) {
    die(`khong doc duoc danh sach file bang git (${err.code === "ENOENT" ? "chua cai git" : err.message}). \`create\` chi chay tu ban checkout git cua starter.`);
  }

  // git ls-files chi thay file da track: thay doi chua commit se khong sang du an moi.
  const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8", timeout: 30000 }).trim();
  if (dirty) {
    console.log(`Canh bao: starter dang co thay doi chua commit — du an moi sinh tu trang thai DA COMMIT, ${dirty.split("\n").length} thay doi se khong di theo.\n`);
  }

  for (const rel of files) {
    const src = path.join(ROOT, rel);
    const out = path.join(dest, rel);
    mkdirSync(path.dirname(out), { recursive: true });
    if (REWRITES[rel]) writeFileSync(out, rewriteFile(rel, readFileSync(src, "utf8"), name));
    else cpSync(src, out);
  }

  const readme = readFileSync(path.join(import.meta.dirname, "templates/README.md"), "utf8");
  writeFileSync(path.join(dest, "README.md"), readme.replaceAll("{{name}}", name).replaceAll("{{db}}", dbName(name)));

  console.log(`Da tao ${name} (${files.length + 1} file) tai ${dest}

Buoc tiep theo (CLI khong tu chay ho):

  cd ${path.relative(process.env.INIT_CWD || process.cwd(), dest) || dest}
  git init && git add -A && git commit -m "init ${name}"
  corepack enable pnpm && pnpm install
  docker compose up -d
  cp apps/api/.env.example apps/api/.env && cp apps/admin-web/.env.example apps/admin-web/.env
  pnpm db:generate && pnpm db:migrate && pnpm db:seed

Doi JWT_SECRET trong apps/api/.env truoc khi deploy. Chi tiet: README.md.`);
}

function report(name, { level, message }) {
  console.log(`${level.padEnd(4)} ${name.padEnd(7)} ${message}`);
  return level === "FAIL";
}

function cmdDoctor() {
  let failed = false;

  failed = report("Node", checkNode(process.version)) || failed;

  // 30s vi lan dau corepack co the phai tai pnpm ve. Exit code khac 0 in nguyen
  // stderr: day chinh la cho bat duoc loi corepack<->Node (pnpm moi doi Node moi).
  let pnpm;
  try {
    pnpm = execFileSync("pnpm", ["--version"], { encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"] }).trim();
    const major = Number(pnpm.split(".")[0]);
    failed = report("pnpm", Number.isNaN(major) || major === 10
      ? { level: "OK", message: `pnpm ${pnpm}` }
      : { level: "WARN", message: `pnpm ${pnpm} — starter khoa pnpm@10 trong "packageManager"` }) || failed;
  } catch (err) {
    const detail = err.code === "ENOENT" ? "chua cai — chay `corepack enable pnpm`" : String(err.stderr || err.message).trim();
    failed = report("pnpm", { level: "FAIL", message: detail }) || failed;
  }

  // Docker CLI co the TREO (daemon chet, sandbox chan) — da xay ra that o repo
  // nay. timeout + SIGKILL de doctor khong bao gio treo. Luon WARN, khong FAIL:
  // thieu Docker chi chan `docker compose up`, khong chan viec sinh du an.
  try {
    const v = execFileSync("docker", ["version", "--format", "{{.Server.Version}}"], {
      encoding: "utf8",
      timeout: 5000,
      killSignal: "SIGKILL",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    report("Docker", { level: "OK", message: `Docker daemon ${v}` });
  } catch (err) {
    const why = err.code === "ENOENT" ? "chua cai" : err.signal === "SIGKILL" ? "khong phan hoi trong 5s" : "daemon chua chay";
    report("Docker", { level: "WARN", message: `Docker ${why} — can cho \`docker compose up -d\` (postgres + redis)` });
  }

  const fs = statfsSync(process.cwd());
  failed = report("Dia", checkDisk(fs.bavail * fs.bsize)) || failed;

  try {
    execFileSync("git", ["--version"], { encoding: "utf8", timeout: 5000, stdio: "ignore" });
    report("Git", { level: "OK", message: "git co san" });
  } catch {
    report("Git", { level: "WARN", message: "khong tim thay git — `rytek create` can git" });
  }

  process.exit(failed ? 1 : 0);
}

function usage() {
  console.log(`rytek — CLI cua starter

  rytek create <path>   sinh du an moi tu starter vao <path>
  rytek doctor          kiem may du dieu kien chay du an chua`);
}

function main() {
  switch (process.argv[2]) {
    case "create":
      return cmdCreate(process.argv[3]);
    case "doctor":
      return cmdDoctor();
    default:
      usage();
      process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) main();
