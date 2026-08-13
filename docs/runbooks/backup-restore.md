# Runbook — Backup & Restore Postgres

Ap dung cho `apps/api` (Postgres 16, xem `docker-compose.yml`). Runbook nay
danh cho dev/self-host, khong gia dinh cloud provider cu the (AWS RDS, GCP
Cloud SQL, ...) — chua co bang chung repo da chon huong nao.

## Quyet dinh thiet ke

- **Dung `pg_dump`/`pg_restore` chuan cua Postgres**, khong viet cong cu
  backup rieng — cong cu nay co san trong moi cai dat Postgres, dung theo
  dung `docs/rytek_platform_roadmap.md` §"Backup/restore va migration
  runbook" (v0.7/v0.8) va nguyen tac khong them dependency khi stdlib/platform
  da giai quyet duoc.
- **Format `-Fc` (custom, nen san)** thay vi plain `.sql`: cho phep
  `pg_restore` chon bang can restore, restore vao schema khac de kiem tra,
  va nen nho hon SQL text.
- **Chua tich hop cloud storage / object storage** (S3, GCS, ...) o buoc nay:
  chua co bang chung du an da chon nha cung cap ha tang. Khi co, chi can them
  buoc upload file `.dump` sau khi backup xong — khong doi cau truc script.
- **Chua tu dong hoa bang cron/systemd timer**: repo chua co pattern
  automation nao tuong tu, va chua ro nhu cau (self-host don le hay co lich
  co dinh). Neu can chay dinh ky, tao cron job goi `scripts/db-backup.sh`
  (vd `0 2 * * * cd /path/to/repo && DATABASE_URL=... ./scripts/db-backup.sh`)
  — chua lam san trong repo nay.

## Script

- `scripts/db-backup.sh` — chay `pg_dump -Fc`, doc `DATABASE_URL` tu bien
  env hien tai hoac fallback doc tu `apps/api/.env`. Output:
  `backups/<ten-db>_<YYYYmmdd_HHMMSS>.dump` (thu muc `backups/` da them vao
  `.gitignore`, khong commit file backup).
- `scripts/db-restore.sh <file.dump>` — chay `pg_restore --clean --if-exists`,
  **yeu cau go dung ten database de xac nhan** truoc khi ghi de — khong bao
  gio am tham drop du lieu.

## Backup thu cong

```bash
# Dung DATABASE_URL tu apps/api/.env (mac dinh), hoac truyen rieng:
./scripts/db-backup.sh

# Hoac chi dinh DATABASE_URL/thu muc output khac:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cms_starter" \
BACKUP_DIR=/path/luu/backup \
./scripts/db-backup.sh
```

File ket qua: `backups/cms_starter_20260812_020000.dump`.

## Restore

```bash
./scripts/db-restore.sh backups/cms_starter_20260812_020000.dump
```

Script se hoi lai — go dung ten database (in ra tu `DATABASE_URL`) de xac
nhan. Sai ten -> huy, khong lam gi ca.

**Luu y:** restore ghi de toan bo du lieu hien co trong database dich
(`--clean`). Muon kiem tra file backup ma khong anh huong DB dev, tro
`DATABASE_URL` sang mot database rong khac truoc khi chay:

```bash
createdb -h localhost -U postgres cms_starter_verify
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cms_starter_verify" \
./scripts/db-restore.sh backups/cms_starter_20260812_020000.dump
```

## Verify restore thanh cong

Sau khi restore, kiem tra nhanh:

```bash
psql "$DATABASE_URL" -c "\dt"                         # bang co day du
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"User\";"  # co du lieu
```

Doi voi restore vao database that (sau su co), chay them
`pnpm --filter @rytek/api dev` va thu dang nhap — xac nhan app hoat dong
binh thuong voi data vua restore.

## Tan suat & retention (goi y, khong bat buoc tu dong)

- **Self-host don gian:** backup thu cong truoc moi lan migrate/deploy quan
  trong, va dinh ky hang ngay neu co du lieu that dang duoc tao ra.
  - `ponytail: chua co lich chay tu dong; can cron/systemd timer khi co nhu
    cau that (production co user that).`
- **Giu bao nhieu ban:** goi y don gian — giu 7 ban gan nhat (vd 7 ngay) la
  du cho da so truong hop self-host quy mo nho. Xoa file cu hon thu cong hoac
  bang mot dong lenh:

  ```bash
  find backups/ -name "*.dump" -mtime +7 -delete
  ```

  Khong can chinh sach retention phuc tap (tiered daily/weekly/monthly) khi
  chua co nhu cau that.
