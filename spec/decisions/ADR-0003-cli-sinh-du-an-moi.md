# ADR-0003 — CLI `rytek create` / `rytek doctor` sinh du an moi tu starter

- **Trang thai:** Accepted
- **Ngay:** 2026-08-12
- **Nguoi quyet dinh:** Ryan
- **Tham chieu:** `docs/rytek_platform_roadmap.md` §9 (AI workflow), §18;
  `CLAUDE.md` (Release Process v0.7, section CLI); ADR-0001

## Boi canh

Muc tieu cua repo la **platform sinh ra nhieu san pham**, nhung tu v0.1 den v0.6
cach duy nhat de bat dau san pham moi la copy tay ca thu muc roi tu nho phai doi
nhung gi (`cms_starter` trong 2 file, ten package, tieu de OpenAPI, phan CLAUDE.md
chi dung cho starter). Copy tay bo sot mot cho la du an moi mang theo ten cua
starter vao DB hoac vao doc API.

`rytek doctor` giai quyet van de thu hai, nho hon nhung lap lai: moi lan setup
tren may moi deu mat thoi gian cho cung mot nhom nguyen nhan (Node qua cu, pnpm
chua enable, Docker chua chay, het dia).

## Quyet dinh

### 1. Danh sach file copy = `git ls-files`, khong phai exclude pattern tu viet

`.gitignore` da loai dung `node_modules/`, `dist/`, `.next/`, `.env`,
`*.tsbuildinfo`, `apps/*/uploads/`, `.claude/settings.local.json`. Viet lai mot bo
pattern trong CLI la duy tri `.gitignore` lan thu hai: moi file local moi cua nguoi
dung (khoa, dump DB, ghi chu ca nhan) la mot lan ro ri neu hai ban lech nhau.

**Danh doi da chap nhan:** `create` chi sinh tu **trang thai da commit**. File chua
`git add` khong di theo. CLI in canh bao khi `git status --porcelain` khac rong,
khong tu dong add va khong chan — nguoi dung tu quyet.

**He qua:** `create` phu thuoc ban checkout git. Chay tu mot goi npm da publish
(khong co `.git`) se bao loi ro rang; neu sau nay publish that thi phai doi nguon
danh sach (vd `files` cua package hoac manifest sinh luc build) — day la viec cua
buoc publish, khong phai cua v1.

### 2. Khong copy `packages/` sang du an sinh ra

San pham khong can cong cu tu sinh san pham. Copy `packages/cli` sang moi du an
moi la tu nhan ban: du an con lai co the sinh du an chau tu mot ban starter da
bi sua, khong con duong quay ve nguon.

Loai luon `pnpm-lock.yaml` (du an moi tu resolve dependency, khong ke thua
resolution cu) va `README.md` (README cua starter co doan lich su `*-legacy` chi
dung voi repo nay — du an moi ghi tu `packages/cli/templates/README.md`).

Nguoc lai, **co copy** `docs/rytek_platform_roadmap.md` va ADR-0001/0002:
`CLAUDE.md` (Required Reading) tro thang vao roadmap, khong copy la de lai link
chet; va du an moi khong quyet dinh lai stack nen "tai sao NestJS/Prisma/Redis"
van la tham chieu that. Co copy `scripts/check-spec.*` + `.claude/skills/new-entity/`
vi du an moi tiep tuc lam Spec-Driven — do la gate + prompt library cua workflow do.

### 3. Giu nguyen `packageManager` trong `package.json` cua du an sinh ra

Do duoc that, khong phai phong xa: trong thu muc **khong co** field
`packageManager`, corepack tu tai pnpm moi nhat (11.x) va pnpm do **doi Node
>= 22.13**. Tren may dang dung (Node 22.6) du an moi se chet ngay lenh
`pnpm install` dau tien voi mot thong bao khong lien quan gi den viec vua lam.

Vi vay `rewriteRootPkg` chi doi `name` va xoa `scripts.cli`; `packageManager`
duoc test khoa lai (`packages/cli/index.test.mjs`).

Cung ly do, moi lenh pnpm phai chay **ben trong** du an moi (corepack doc
`packageManager` theo cwd, khong theo `--dir`).

### 4. CLI chi sinh file — khong tu chay install / git init / docker / migrate

`create` ket thuc bang **in ra** cac lenh tiep theo. Ly do: moi lenh do deu co
tac dung phu lon va deu co the that bai vi ly do rieng cua may (mang, dia, port,
Docker chua chay). Mot CLI vua copy file vua chay 6 lenh dai la mot CLI ma khi
hong khong ai biet no hong o buoc nao. `doctor` co de kiem truoc dieu kien, khong
phai de sua ho.

Cung ly do, `doctor` **khong** kiem Postgres/Redis that: du an phai `doctor` duoc
truoc khi `docker compose up`, nen "chua chay" khong the la loi. Docker check luon
la WARN va co `timeout: 5000` + `killSignal: "SIGKILL"` — Docker CLI treo la
chuyen da xay ra that trong repo nay, mot cong cu chan doan khong duoc phep treo.

### 5. Khong publish npm o v1

`pnpm create rytek-cms` can tai khoan npm + chien luoc version giua CLI va starter.
Do la viec **xuat ban**, tach khoi viec **CLI chay dung**. v1 chay tu ban checkout:
`pnpm cli create ../my-shop`. Publish la buoc tiep theo, keo theo quyet dinh 1
(nguon danh sach file khi khong co `.git`).

### 6. Duong dan dich resolve theo `INIT_CWD`, tu choi dich nam trong starter

`pnpm run` doi cwd thanh root workspace. Neu resolve theo `process.cwd()` thi
`pnpm cli create my-shop` go trong repo se de ca du an moi **giua chinh starter**
(rat kho don, va lan chay sau se copy ca no). CLI resolve theo `INIT_CWD` (pnpm
dat bien nay = thu muc nguoi dung dang dung) va tu choi moi dich nam trong starter.

## He qua

- Them `packages/cli` — package dau tien trong `packages/*` (truoc do glob rong).
  Zero dependency: chi `node:fs`/`node:path`/`node:child_process`.
- Root `package.json`: them script `cli`, `lint` mo rong sang `packages`.
- Bang doi ten tap trung trong `REWRITES` (`packages/cli/index.mjs`). Doi ten mot
  heading trong `CLAUDE.md` ma quen sua bang nay -> `replaceSection` **throw**,
  khong lech im lang: CLAUDE.md dieu khien hanh vi agent, mot section sai ngu canh
  di theo hang tram du an la loi dat.
- Du an sinh ra van dung scope `@rytek/*` cho hai app con (package private trong
  workspace, khong can unique toan cuc; doi thi phai sua moi script `--filter`).

## Phuong an da loai

| Phuong an | Ly do loai |
|---|---|
| `cpSync` + exclude pattern tu viet | Duy tri `.gitignore` lan hai; sot mot pattern = ro ri file local. |
| Degit / tai tarball tu GitHub | Can mang + repo public; starter dang dung noi bo, ban local moi la ban that. |
| Template engine (handlebars/ejs) | 6 file doi noi dung, 2 bien. `replaceAll` du. |
| `commander` + `prompts` | 2 subcommand, 1 tham so positional bat buoc. `switch` du, zero dependency. |
| Sinh CLAUDE.md tu template rieng | ~140/194 dong du an moi phai thua ke nguyen ven; thay-section giu chung duoc mot nguon. |
| Tham so hoa theme/branding, chon stack | Starter chi co mot stack; chua co nguoi dung thu hai de biet cai gi dang phai tham so hoa. |
| `rytek add <entity>` | Skill `/new-entity` da lam dung viec do. |
