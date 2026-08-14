# ADR-0005 — Deploy 1 VPS: git checkout + build tai cho + systemd, khong Docker hoa app

- **Trang thai:** Accepted
- **Ngay:** 2026-08-13
- **Nguoi quyet dinh:** Ryan
- **Tham chieu:** `CLAUDE.md` (Release Process v0.8); `docs/runbooks/deploy.md`;
  `docs/runbooks/backup-restore.md`; ADR-0001; ADR-0004

## Boi canh

v0.8 con mang cuoi: **deploy + rollback runbook**. Ha tang da duoc chot o muc
tho: **self-host mot VPS don gian**, chua chon nha cung cap, khong phai K8s,
khong phai managed PaaS.

Hien trang lien quan den quyet dinh nay:

- Repo **chua co Dockerfile nao**. `docker-compose.yml` duy nhat hien co chi
  chay Postgres 16 + Redis 7 cho dev.
- `apps/api` build bang `nest build` -> `apps/api/dist/main.js`, chay bang
  `node dist/main.js`. `apps/admin-web` build bang `next build`, chay bang
  `next start -p 3000`. Ca hai deu la process Node thuong, doc `.env` canh
  no (`process.loadEnvFile()` o `apps/api/src/common/env.ts`; Next.js tu nap
  `.env`).
- CI da chay dung chuoi lenh se dung khi deploy: `pnpm install --frozen-lockfile`
  -> `pnpm db:generate` -> `lint/typecheck/test/build`, tren **Node 22**.
- `prisma/migrations/` chi co file `migration.sql` — **khong co down script**.
  Prisma Migrate khong sinh san chieu nguoc.

Cau hoi thuc su phai tra loi: **co Docker hoa `apps/api` + `apps/admin-web`
khong**, hay deploy thang tu git tren VPS.

## Quyet dinh

### 1. Khong Docker hoa app. Deploy = `git checkout <tag>` + build tai cho tren VPS

Duong deploy: `git fetch --tags` -> `git checkout <tag>` ->
`pnpm install --frozen-lockfile` -> `pnpm db:generate` -> `pnpm db:deploy`
(migration) -> `pnpm build` -> `systemctl restart` -> health check.

Ly do chinh: **Docker hoa la mot khoi viec moi khong ai kiem tra duoc**. No
gom 2 Dockerfile multi-stage cho pnpm workspace (phai xu ly `pnpm fetch`/
`--filter --prod deploy`, Prisma engine binary phai khop base image
glibc/musl, Next.js phai bat `output: "standalone"` moi co image goi ghe),
mot `.dockerignore`, mot compose production. Repo **khong co bat ky lenh nao
kiem tra Dockerfile** — `pnpm lint/typecheck/test/build` khong cham toi no.
Nghia la them ~150 dong cau hinh khong test tu dong duoc, cho mot VPS duy nhat.

Doi lai duoc gi: image bat bien va build o CI. Ca hai deu la loi ich cua
**nhieu may / nhieu moi truong** — thu ta khong co. Voi 1 VPS, "artifact bat
bien" duoc thay bang mot thu ret hon va da co san: **git tag** (xem §5).

### 2. Postgres + Redis giu nguyen `docker-compose.yml` hien co

Khong doi gi. Docker o day dung dung cho cua no: chay hai stateful service
chuan (`postgres:16-alpine`, `redis:7-alpine`) ma khong phai cai/tune bang
tay tren tung distro. Cai **khong** duoc Docker hoa la code cua chinh repo
nay — thu thay doi moi lan deploy.

Production chi doi 2 thu o compose, ghi ro trong runbook: doi password mac
dinh, va **khong publish port 5432/6379 ra ngoai** (bind `127.0.0.1`).

### 3. Process manager = systemd, khong PM2

systemd co san tren moi VPS Linux hien dai, **khong them mot dependency nao**:
no da lam du restart-on-crash, start khi boot, gom log (`journalctl`), gioi han
tai nguyen. PM2 la mot supervisor thu hai chong len supervisor cua OS — de
duoc them mot dashboard `pm2 list` va cluster mode ma he nay chua can.

Hai unit file (`rytek-api.service`, `rytek-web.service`) nam **trong runbook
duoi dang code block**, khong tao thu muc `deploy/` trong repo: chung phu thuoc
duong dan tren may that (`/srv/rytek`, user chay service) nen khong the commit
mot ban dung chung; va repo chua co tien le thu muc cau hinh ha tang.

### 4. `pnpm db:deploy` (= `prisma migrate deploy`) — **khong bao gio** chay `pnpm db:migrate` tren production

`pnpm db:migrate` hien tai la `prisma migrate dev`: lenh **cua may dev**. No so
sanh schema voi DB, co the hoi tuong tac, va trong truong hop drift co the
**reset toan bo database**. Chay nham no tren production la mat du lieu.

Vi vay them mot script goc: `"db:deploy": "prisma migrate deploy --schema
prisma/schema.prisma"` — chi ap dung migration da commit, khong sinh migration,
khong reset, khong hoi. Day la mot dong duy nhat va no chan dung mot loi mat
du lieu that; khong phai "config cho su phong".

### 5. Rollback code va rollback DB la **hai viec khac nhau**, khong gop

- **Rollback code:** `git checkout <tag-cu>` -> install -> build -> restart.
  Nhanh, an toan, lam duoc bat cu luc nao. Vi vay **moi lan deploy phai tao
  tag** — tag la thu thay cho "artifact bat bien" o §1.
- **Rollback DB:** khong co co che tu dong. Prisma khong sinh down migration
  (da kiem tra `prisma/migrations/`), va repo nay **khong tu viet down script**
  — xem bang phuong an loai. Cach an toan duy nhat de quay lai schema cu la
  **restore tu backup** (`scripts/db-restore.sh`, ADR/runbook backup-restore),
  chap nhan mat du lieu ghi trong khoang giua.

He qua thuc te, ghi ro trong runbook: **backup ngay truoc khi chay migration**,
va uu tien migration **tuong thich nguoc** (them cot nullable / them bang truoc,
xoa cot o mot ban phat hanh sau) — de rollback code khong can dung toi DB. Day
la cach lam rollback re nhat, khong phai cach ky thuat nhat.

### 6. TLS + reverse proxy la **bat buoc**, khong phai loi khuyen chung

Khong phai vi "production nen co HTTPS", ma vi mot rang buoc that trong code:
`apps/admin-web/app/login/actions.ts` set cookie phien voi
`secure: process.env.NODE_ENV === "production"`. Chay production tren `http://`
thuan -> browser **khong luu cookie** -> khong ai dang nhap duoc. TLS la dieu
kien de app chay dung, khong phai tuy chon.

Runbook nen **Caddy** (1 file 3 dong, tu xin va gia han Let's Encrypt) va chi
viet dung Caddyfile toi thieu. Khong viet cau hinh nginx + certbot day du:
ngoai pham vi "runbook deploy code" va co vo so huong dan tot hon ngoai kia.

Cung tai day: **`/metrics` khong duoc lo ra internet** (ADR-0004 §5) — reverse
proxy chi proxy `/` cua web va cac path can thiet cua API, khong mo `/metrics`.

### 7. Chap nhan downtime vai giay moi lan deploy

`systemctl restart` = process chet roi len lai. Khong lam blue-green / hai
instance + doi upstream: no can them mot tang dieu phoi, them cau hinh proxy
dong, va chi tra tien khi co SLA that. Chua co.

## Cac phuong an da can nhac va loai

| Phuong an | Ly do loai |
|---|---|
| Docker hoa `apps/api` + `apps/admin-web` (multi-stage + compose prod) | §1: khoi viec moi ~150 dong khong co lenh kiem tra tu dong nao trong repo, doi lay loi ich cua nhieu-may trong khi chi co 1 VPS. Neu sau nay chuyen K8s/PaaS thi Dockerfile viet bay gio cung phai viet lai theo target do. |
| Next.js `output: "standalone"` | Chi co y nghia de lam image nho — ma ta khong lam image. Them config + doi cach chay de toi uu mot thu khong dung toi. |
| PM2 | Supervisor thu hai chong len systemd (da co san, da lam restart/boot/log). Them dependency de lay `pm2 list`. |
| Build o CI roi `rsync` artifact len VPS | Can artifact store + phai dam bao Node/glibc cua CI khop VPS (Prisma engine, native module). Voi 1 VPS, build tai cho don gian hon va it thu di chuyen hon. |
| CI/CD tu dong deploy khi push `main` (GitHub Actions + SSH) | Chua chot nha cung cap, chua co staging, chua co smoke test tu dong. Tu dong hoa mot quy trinh chua chay tay lan nao la tu dong hoa mot gia thiet. |
| K8s / managed PaaS (Fly/Render/Railway) | User da chot: VPS don gian. |
| Tu viet down migration cho moi migration | Prisma khong sinh san; viet tay chieu nguoc cho **moi** migration la chi phi thuong truc tra cho mot su kien hiem, va van khong khoi phuc duoc du lieu da mat khi drop cot. Backup/restore (`scripts/db-restore.sh`) da giai quyet dung van de do. |
| `pnpm db:migrate` (`migrate dev`) tren production | §4: co the reset database. |
| Zero-downtime (blue-green / 2 instance + switch upstream) | §7: chua co SLA, chua co ai bi anh huong boi vai giay downtime. |
| Tao thu muc `deploy/` chua file `.service` trong repo | §3: unit file phu thuoc duong dan/user tren may that, khong commit duoc ban dung chung. Giu trong runbook de sua khi copy. |
| Viet day du nginx + certbot vao runbook | §6: ngoai pham vi. Caddy 3 dong da du de dung duoc. |

## He qua

**Duoc:**

- **Khong them dependency nao**, khong them file cau hinh nao vao repo ngoai
  1 dong script `db:deploy` + 2 file tai lieu.
- Deploy va rollback dung **cung mot bo lenh** da chay hang ngay o dev va o CI
  — it duong khac nhau giua may dev, CI va production.
- Khong bi khoa vao Docker: neu sau nay chot K8s/PaaS, viec phai lam la viet
  Dockerfile cho target do — **giong het** viec phai lam neu bay gio da co
  Dockerfile viet cho VPS.
- Rollback code re va nhanh: 4 lenh, khong can artifact registry.

**Phai chap nhan:**

- **Build chay tren chinh VPS**: `next build` an CPU/RAM. VPS 1GB RAM co the
  bi OOM — runbook ghi nguong khuyen nghi (2GB + swap). Trong luc build, may
  cham hon binh thuong.
- **Downtime vai giay** moi lan restart (§7).
- **Khong immutable artifact**: hai lan build cung mot commit ve ly thuyet co
  the khac nhau. Giam thieu bang `--frozen-lockfile` (bat buoc trong runbook)
  va Node phai la ban 22 giong CI.
- `node_modules/` + source nam trong tren VPS (khoang vai tram MB), khong goi
  ghe nhu image.
- **Rollback DB khong tu dong** (§5) — phai co backup truoc khi migrate, do la
  ky luat con nguoi chu khong phai co che ky thuat.
- Chua co deploy tu dong: moi lan phat hanh la mot phien SSH thu cong.

## Xem lai khi nao

- **Khi co >1 may hoac them moi truong staging:** luc do image bat bien va
  build o CI bat dau tra tien -> quay lai can nhac Docker (§1) va CI/CD.
- **Khi downtime vai giay bat dau lam phien nguoi dung that** (co SLA, co
  traffic ngoai gio): lam blue-green hoac dung reverse proxy giu ket noi.
- **Khi deploy tay bat dau sai** (quen `db:deploy`, quen tag, quen backup):
  do la luc script hoa `scripts/deploy.sh` — khong lam truoc khi quy trinh
  tay da chay on it nhat vai lan.
- **Khi RAM VPS khong du de build**: chuyen sang build o CI + rsync artifact,
  hoac Docker — do la trieu chung dau tien that su bac bo §1.
- Cung luc chot ha tang nay: lam not viec con no cua ADR-0004 §"Xem lai khi
  nao" — chan `/metrics` khoi internet (§6 o day da ghi), tro scraper vao,
  dinh nghia alert dau tien.
