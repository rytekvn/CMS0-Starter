# Runbook — Deploy & Rollback (self-host 1 VPS)

Ap dung cho `apps/api` (NestJS :4000) + `apps/admin-web` (Next.js :3000) tren
**mot VPS Linux co systemd** (Ubuntu/Debian 22.04+ hoac tuong duong).
Postgres + Redis chay bang `docker-compose.yml` co san.

Khong Docker hoa app — ly do va cac phuong an da loai:
`spec/decisions/ADR-0005-deploy-vps-git-systemd.md`.

Quy uoc trong runbook: repo nam o `/srv/rytek`, chay bang user `rytek`
(khong phai root). Doi duong dan/user thi sua tuong ung trong unit file.

## 0. Yeu cau may

| Muc | Toi thieu | Ly do |
|---|---|---|
| RAM | **2GB + swap** | `next build` chay tren chinh VPS. 1GB rat de OOM giua chung build. |
| Dia | ~5GB trong | `node_modules` + `.next` + image Postgres/Redis + backup. |
| Node | **22.x** (giong CI) | `process.loadEnvFile()` va `node --test` cua repo yeu cau Node >= 22. |
| systemd | co | Process manager (khong dung PM2). |
| Docker | co | Chi de chay Postgres + Redis. |

## 1. Chuan bi VPS (lam mot lan)

### 1.1 Cai dat

```bash
# Node 22 (vd qua nvm cho user rytek, hoac NodeSource - tuy distro)
node -v            # phai la v22.x
corepack enable pnpm

# Docker + compose plugin: theo huong dan chinh thuc cua distro
docker --version && docker compose version
```

### 1.2 Lay code

```bash
sudo mkdir -p /srv/rytek && sudo chown rytek:rytek /srv/rytek
git clone <repo-url> /srv/rytek
cd /srv/rytek
git checkout <tag-muon-chay>        # luon deploy tu tag, khong tu nhanh main
```

### 1.3 Tao file `.env` (KHONG commit, khong copy tu may khac)

```bash
cp apps/api/.env.example        apps/api/.env
cp apps/admin-web/.env.example  apps/admin-web/.env
```

Sua tay `apps/api/.env`:

| Bien | Gia tri production |
|---|---|
| `DATABASE_URL` | Password **that**, khong phai `postgres:postgres` cua compose dev. |
| `PORT` | `4000` (giu nguyen; reverse proxy tro vao day). |
| `JWT_SECRET` | Chuoi random that: `openssl rand -base64 48`. Doi gia tri nay -> moi token dang luu hanh bi vo hieu (user phai dang nhap lai). |
| `REDIS_URL` | `redis://localhost:6379` neu Redis chay tren cung may. |

`apps/admin-web/.env`: `API_URL="http://localhost:4000"` (goi noi bo, khong
di qua internet).

**`NODE_ENV=production` khong dat trong `.env`** — no duoc dat trong unit file
systemd (§1.5), de khong the quen khi khoi dong lai.

```bash
chmod 600 apps/api/.env apps/admin-web/.env
```

### 1.4 Postgres + Redis

Truoc khi chay lan dau tren VPS, sua `docker-compose.yml` **ngay tren may do**
(khong commit thay doi nay):

- Doi `POSTGRES_PASSWORD` thanh password that (khop `DATABASE_URL`).
- **Khong publish port ra ngoai**: doi `"5432:5432"` -> `"127.0.0.1:5432:5432"`
  va `"6379:6379"` -> `"127.0.0.1:6379:6379"`. Postgres/Redis mo ra internet la
  loi bao mat pho bien nhat cua self-host.

```bash
docker compose up -d
docker compose ps          # ca hai phai healthy
```

### 1.5 systemd unit

Hai file duoi day khong nam trong repo (chung phu thuoc duong dan + user cua
tung may — ADR-0005 §3). Tao truc tiep tren VPS.

`/etc/systemd/system/rytek-api.service`:

```ini
[Unit]
Description=Rytek API (NestJS)
# Docker giu Postgres/Redis: doi docker len truoc, nhung khong coi la
# dieu kien du - app tu chiu duoc DB chua san sang (/health/ready tra 503).
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
User=rytek
WorkingDirectory=/srv/rytek/apps/api
# cwd = apps/api -> process.loadEnvFile() nap dung apps/api/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/env node dist/main.js
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/rytek-web.service`:

```ini
[Unit]
Description=Rytek Admin Web (Next.js)
After=network-online.target rytek-api.service
Wants=network-online.target

[Service]
Type=simple
User=rytek
WorkingDirectory=/srv/rytek/apps/admin-web
Environment=NODE_ENV=production
# Next.js tu nap apps/admin-web/.env
ExecStart=/srv/rytek/apps/admin-web/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable rytek-api rytek-web      # chua start - can build truoc (§1.6)
```

### 1.6 Lan chay dau tien

```bash
cd /srv/rytek
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:deploy                 # ap dung migration (KHONG phai pnpm db:migrate - xem §2.1)
pnpm db:seed                   # CHI lan dau: tao role/permission + super admin
pnpm build
sudo systemctl start rytek-api rytek-web
```

Sau do lam smoke test §4.

**Doi ngay password super admin** sau lan dang nhap dau. Mac dinh cua
`pnpm db:seed` (`admin@rytek.local`) khong duoc de nguyen tren may co internet;
co the dat truoc bang `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

### 1.7 Reverse proxy + TLS — **bat buoc**, khong phai tuy chon

Khong phai vi "production nen co HTTPS". Vi mot rang buoc that trong code:
cookie phien duoc set voi `secure: NODE_ENV === "production"`
(`apps/admin-web/app/login/actions.ts`). Chay production tren `http://` thuan
-> browser khong luu cookie -> **khong ai dang nhap duoc**.

Caddy la lua chon it cau hinh nhat (tu xin + gia han Let's Encrypt).
`/etc/caddy/Caddyfile` toi thieu:

```
admin.vi-du.com {
    reverse_proxy localhost:3000
}
```

Chi expose `apps/admin-web`. `apps/api` (:4000) **khong** can mo ra internet —
`admin-web` goi no qua `localhost`. Neu buoc phai mo API ra ngoai (client
khac), thi:

- **Khong bao gio expose `/metrics`** (khong co auth theo thiet ke —
  ADR-0004 §5). Chan o proxy hoac o firewall.
- Nho bat CORS o `apps/api` luc do (hien dang tat co chu dich).

Firewall: chi mo 80/443. Chan 3000, 4000, 5432, 6379 tu ben ngoai.

## 2. Deploy ban moi

Thu tu duoi day quan trong. **Khong doi thu tu** — nhat la backup truoc
migrate, va health check truoc khi coi la xong.

```bash
cd /srv/rytek

# 1. BACKUP DB TRUOC (bat buoc neu ban nay co migration moi)
./scripts/db-backup.sh
#    -> backups/cms_starter_<timestamp>.dump  — nho ten file nay de rollback

# 2. Ghi lai version dang chay (de rollback biet quay ve dau)
git describe --tags        # vd v0.8.0

# 3. Lay code moi (luon deploy tu tag da tao san)
git fetch --all --tags
git checkout <tag-moi>

# 4. Dependency + Prisma client
pnpm install --frozen-lockfile
pnpm db:generate

# 5. Migration (chi khi ban nay co migration moi; chay khong thua cung vo hai)
pnpm db:deploy

# 6. Build
pnpm build

# 7. Restart (downtime vai giay - co chu dich, xem ADR-0005 §7)
sudo systemctl restart rytek-api rytek-web

# 8. Health check - CHUA XONG cho den khi buoc nay xanh (§4)
curl -fsS localhost:4000/health/ready && echo OK
curl -fsSI localhost:3000/login | head -1
```

### 2.1 `pnpm db:deploy` chu khong phai `pnpm db:migrate`

- `pnpm db:deploy` = `prisma migrate deploy`: **chi** ap dung migration da
  commit. Khong sinh migration, khong hoi, khong reset.
- `pnpm db:migrate` = `prisma migrate dev`: **lenh cua may dev**. Khi phat hien
  drift no co the **reset toan bo database**. Chay nham tren production la mat
  du lieu.

### 2.2 Migration nen tuong thich nguoc

Rollback code de; rollback schema thi khong (§3.2). Vi vay khi viet migration,
uu tien chieu **expand rồi contract**:

- Ban N: them cot nullable / them bang moi. Code cu van chay duoc voi schema moi.
- Ban N+1 (sau khi ban N da on dinh): moi xoa cot cu / that chat constraint.

Lam duoc vay thi rollback code **khong can dung toi DB** — day la ky luat re
nhat de deploy an toan.

## 3. Rollback

**Doc truoc:** rollback code va rollback DB la hai viec khac nhau. Lam nham
thu tu se hong nang hon truoc do.

### 3.1 Rollback code (truong hop thuong gap)

Dung khi ban moi loi nhung **khong co migration pha tuong thich nguoc** (khong
co migration nao, hoac chi them cot nullable/bang moi):

```bash
cd /srv/rytek
git checkout <tag-cu>            # tag da ghi lai o §2 buoc 2
pnpm install --frozen-lockfile   # lockfile cua ban cu co the khac
pnpm db:generate
pnpm build
sudo systemctl restart rytek-api rytek-web
curl -fsS localhost:4000/health/ready && echo OK
```

**Khong** chay `pnpm db:deploy` khi rollback — migration da chay roi, va lenh
nay khong bao gio di nguoc.

Schema moi (cot nullable thua, bang thua) o lai trong DB. Code cu khong dung
toi -> vo hai. Don o ban phat hanh sau, khong don giua luc su co.

### 3.2 Rollback DB (chi khi migration da pha tuong thich nguoc)

Dau hieu: sau khi rollback code, `/health/ready` van 200 nhung app loi that
(query truot cot da bi xoa/doi kieu, Prisma bao khong khop schema).

**Prisma khong co down migration.** `prisma/migrations/` chi co `migration.sql`,
khong co chieu nguoc, va repo nay co y khong tu viet (ADR-0005 §5). Cach an
toan duy nhat de quay lai schema cu:

```bash
sudo systemctl stop rytek-api rytek-web       # dung ghi them vao DB truoc khi restore
./scripts/db-restore.sh backups/cms_starter_<timestamp>.dump
#   -> script hoi lai, phai go dung ten database de xac nhan
sudo systemctl start rytek-api rytek-web
```

**Cai gia phai tra, biet truoc:** restore ghi de toan bo DB bang ban backup ->
**moi thay doi du lieu tu luc backup den bay gio bi mat**. Do la ly do buoc
backup o §2 nam truoc migration, va la ly do §2.2 dang gia hon moi thu o day.

Khong co lua chon thu ba. Neu du lieu ghi trong khoang do la quan trong, dung
lai va xu ly tay (dump bang bi anh huong ra rieng truoc khi restore) — dung
tiep tuc theo runbook mot cach may moc.

### 3.3 Thu khong bi rollback dung toi

- **File upload** (`apps/api/uploads/`): nam tren dia, khong trong git, khong
  trong DB dump. `git checkout` khong dung toi, `db-restore.sh` cung khong.
  Nhung neu DB bi restore ve truoc, cac ban ghi `File` moi bien mat trong khi
  file van con tren dia -> file mo coi. Vo hai, don sau.
- **Redis** (cache auth + queue): khong can rollback. Cache tu het han (TTL
  60s); job dang cho co the mat -> chap nhan duoc theo ADR-0002.

## 4. Health check / smoke test sau deploy

Deploy **chua duoc coi la thanh cong** cho den khi ca 4 muc duoi xanh.

```bash
# 1. API song (khong cham DB)
curl -fsS localhost:4000/health/live
# -> {"status":"ok"}

# 2. API san sang (CO cham DB) - day la muc quan trong nhat
curl -fsS localhost:4000/health/ready
# -> {"status":"ok","db":"up"}     ; 503 = DB down/chua migrate

# 3. Metrics con day (xac nhan process chay dung, khong chi la port mo)
curl -fsS localhost:4000/metrics | head -5
# -> co dong bat dau bang "# HELP ..."

# 4. Web tra ve trang login
curl -fsSI localhost:3000/login | head -1
# -> HTTP/1.1 200 OK
```

Sau do lam **mot lan dang nhap that qua domain HTTPS** (khong phai localhost):
day la thu duy nhat kiem duoc chuoi day du proxy -> TLS -> cookie `secure` ->
`admin-web` -> `apps/api` -> DB. Cac lenh `curl` o tren khong kiem duoc no.

Log khi co van de:

```bash
sudo journalctl -u rytek-api -n 100 --no-pager
sudo journalctl -u rytek-web -n 100 --no-pager
sudo systemctl status rytek-api rytek-web
```

Log cua `apps/api` la JSON (pino), moi dong co `reqId` — dung no de lan mot
request qua nhieu dong log, ke ca sang worker BullMQ.

## 5. Nhung gi runbook nay co y **khong** lam

- **Khong deploy tu dong khi push.** Chua chot nha cung cap, chua co staging,
  chua co smoke test tu dong. Script hoa (`scripts/deploy.sh`) khi quy trinh
  tay nay da chay on vai lan — khong truoc do.
- **Khong zero-downtime.** `systemctl restart` = downtime vai giay
  (ADR-0005 §7).
- **Khong cau hinh nginx/certbot day du**, khong tune Postgres, khong cai dat
  monitoring stack. Cai cuoi la viec con no cua ADR-0004 §"Xem lai khi nao",
  lam khi da co may that.
