# ADR-0001 — NestJS + Next.js tren pnpm monorepo

- **Trang thai:** Accepted
- **Ngay:** 2026-08-08
- **Nguoi quyet dinh:** Ryan
- **Tham chieu:** `docs/rytek_platform_roadmap.md` §5, §13 (v0.1), §18

## Boi canh

Repo bat dau la mot **CMS starter** don le: `api/` (Hono + `@hono/node-server`)
va `admin-web/` (Vite + react-router), moi cai la mot project npm rieng voi
`package-lock.json` rieng. No chay tot va da vuot ca v0.1/v0.2 cua `CLAUDE.md` cu.

Nhung muc tieu that khong phai "mot CMS". `docs/rytek_platform_roadmap.md`
dinh nghia Rytek la mot **platform sinh ra nhieu san pham**, voi stack da chot
o §18: NestJS modular monolith, Next.js, Prisma + PostgreSQL, Redis + BullMQ,
Spec-Driven Development. Mo hinh "copy ca thu muc sang du an moi" khong scale:
moi ban sao lech dan, khong co duong nang cap chung, va khong co cho de dat
package dung chung (design system, UI, SDK).

Do do van de can giai khong phai "code hien tai kem", ma la **hinh dang cua
repository sai so voi thu se xay tiep**.

## Quyet dinh

1. **Chuyen sang NestJS (backend) + Next.js App Router (frontend)** dung theo
   stack da chot o roadmap §18.
2. **pnpm workspace monorepo** ngay o buoc nay, truoc khi viet them tinh nang:
   `apps/*` + `packages/*` (khai bao san glob, chua tao package nao).
3. **Chay song song, khong big-bang rewrite.** Code cu duoc di chuyen nguyen
   trang (khong sua mot dong `src/` nao) sang `apps/api-legacy` va
   `apps/admin-web-legacy`, van chay dung port cu. Skeleton moi
   (`apps/api`, `apps/admin-web`) dung canh no. Nghiep vu (auth/user/role/
   product/file) **chua migrate o dot nay**.
4. **Thu tu dau tu theo roadmap:** Starter + Spec truoc, CLI sau, AI Generator
   cuoi. CLI (`pnpm create rytek-cms`) bi doi xuong v0.7 cua repo nay.

## Port map

| Ung dung | Port | Trang thai |
|---|---|---|
| `apps/admin-web` (Next.js) | 3000 | Skeleton moi |
| `apps/api` (NestJS) | 4000 | Skeleton moi |
| `apps/api-legacy` (Hono) | 3001 | Dang chay that, giu nguyen |
| `apps/admin-web-legacy` (Vite) | 5173 | Dang chay that, giu nguyen |

## Cac phuong an da can nhac va loai

| Phuong an | Ly do loai |
|---|---|
| Giu Hono + Vite, chi tach monorepo | Lech stack da chot §18; khong co DI/module boundary de nhieu nguoi + AI cung lam mot codebase lon; khong co duong sang BullMQ/OpenAPI/guard chuan cua Nest. |
| Rewrite thang sang NestJS/Next, xoa code cu | Rui ro regression cao cho phan **dang chay that**, va khong co moc de doi chieu hanh vi. Chay song song cho phep migrate tung module, do duoc. |
| npm/yarn workspaces thay pnpm | Roadmap chot pnpm; pnpm isolated node_modules bat som loi phu thuoc an, tiet kiem dia khi so app tang. |
| Turborepo / Nx ngay tu dau | 4 project, build vai giay. Chua co bottleneck -> chua tra gia cau hinh. Them khi CI that su cham. |
| Tao san `packages/db`, `packages/config`, ... | Se la vo rong khong noi dung. `prisma/schema.prisma` o root da du. Tao package khi co consumer thu hai that. |
| eslint + typescript-eslint | ~6 dependency + config cho mot repo chua co rule rieng. Chon `oxlint`: 1 devDependency, zero-config. |
| vitest / jest | `node --test` co san trong Node, chay duoc 2 file test hien co ma khong sua dong nao. 0 dependency moi. |

## He qua

**Duoc:**
- Mot lockfile, mot lenh `pnpm install`, mot bo gate `lint/typecheck/test/build`
  cho ca repo.
- Co cho dat `packages/*` khi design system / SDK ra doi.
- Skeleton chung minh chuoi web -> api -> db chay that
  (`/health/ready` + trang `:3000`), tuc la nen mong da dung truoc khi xay tiep.
- Code dang chay khong bi dong toi -> khong co regression o dot nay.

**Phai chap nhan:**
- **Hai stack song song trong mot thoi gian.** `apps/*-legacy` chi duoc xoa khi
  module cuoi cung da migrate xong. Do la no ky thuat co han, khong phai kien truc lau dai.
- NestJS bat buoc `experimentalDecorators` + `emitDecoratorMetadata`, khac han
  tsconfig cua legacy -> `apps/api` khong dung chung duoc `tsx`/esbuild
  cho runtime (esbuild khong ho tro `emitDecoratorMetadata`); build bang `nest build` (tsc).
- Bo 2 `package-lock.json` -> dependency cai lai theo semver range, co the len
  minor moi.
- Tailwind + shadcn/ui (§18) **hoan sang v0.4**. Token CSS-var da co san trong
  `styles.css` cu, da copy sang `globals.css`, nen them Tailwind sau khong mat cong.
- `oxlint` lech voi default ecosystem cua NestJS/Next. Neu sau nay can rule
  rieng cua Next (vd `eslint-config-next`), co the phai bo sung eslint.

## Xem lai khi nao

- Khi module nghiep vu dau tien da migrate xong: danh gia lai xem viec chay song
  song con dang gia khong.
- Khi `pnpm build` vuot ~2 phut: xem lai quyet dinh khong dung Turborepo/Nx.
- Khi can rule lint rieng cua Next/Nest: xem lai quyet dinh oxlint.
