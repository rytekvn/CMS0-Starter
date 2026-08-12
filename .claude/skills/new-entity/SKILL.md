---
name: new-entity
description: Sinh bo 3 file spec (entities/permissions/acceptance) cho mot entity moi cua Rytek Platform, dien san tu template `spec/*/_template.*` cua repo. Dung skill nay bat cu khi nguoi dung muon them mot entity/model/bang du lieu moi (vd "them entity Organization", "lam CRUD cho Invoice", "tao model Tag", "new entity", "spec cho entity moi", "/new-entity"), KE CA khi ho noi bang ngon ngu code truoc ("them bang orders vao he thong") — trong repo nay spec phai co truoc code, nen hay chay skill nay truoc khi viet bat ky file NestJS/Next.js/Prisma nao cho entity do.
---

# new-entity — sinh spec cho entity moi

Repo nay lam Spec-Driven Development: **spec co truoc code**, va spec da duyet
la contract. Skill nay lam dung mot viec — sinh bo 3 file spec cho mot entity
moi, dien san theo dung template va convention hien co — de nguoi dung khong
phai copy-paste 3 file roi tu nho tung quy uoc (AC-ID, dong `**Test:**`,
soft delete, audit event...).

Skill nay **khong viet code** va **khong duyet spec ho nguoi dung**. Ly do o
muc "Ranh gioi" cuoi file.

## Buoc 1 — Thu du thong tin

Can du 5 thong tin sau truoc khi sinh file. Cai nao nguoi dung da noi trong
prompt thi lay luon, dung hoi lai; chi hoi cai con thieu, hoi mot lan trong
mot tin nhan (dung hoi lat nhat tung cau):

1. **Ten entity** dang PascalCase (vd `Organization`). Tu day suy ra:
   - `<entity>` = camelCase cho permission key va base path (vd `organization`)
   - `<ENTITY>` = UPPERCASE cho AC-ID (vd `ORGANIZATION`)
   - ten file = kebab/lowercase (vd `organization.yaml`)
2. **Mo ta 1-2 cau**: entity dai dien cho cai gi, dung o dau.
3. **Field nghiep vu**: ten + type + required. Type hop le theo template:
   `string | int | datetime | boolean | enum | string[] | object[]`.
   Field ha tang (`id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`,
   `deletedAt`) **khong can hoi** — moi model deu co, template da co san.
4. **Action ngoai CRUD** (export/import/bulk/upload/...) — co hay khong.
   Moi action them mot permission key va mot heading acceptance rieng.
5. **Relation / referenceData** — co quan he voi entity khac khong, co du lieu
   tham chieu do seed so huu khong. Neu **co chu dich khong co**, ghi
   `relations: []` kem comment `# Co y de rong: <ly do>` (template giai thich
   vi sao: de phan biet "khong co" voi "chua nghi toi").

Neu nguoi dung tra loi mo ho o cho co anh huong lon (vd type cua mot field
tien te, hay mot field co unique hay khong), hoi ro thay vi doan — doan sai o
spec se keo theo sai o Prisma, validation va permission.

## Buoc 2 — Doc template tuoi

Doc 3 file nay **tai thoi diem chay**, moi lan:

- `spec/entities/_template.yaml`
- `spec/permissions/_template.yaml`
- `spec/acceptance/_template.feature.md`

Dung nho hay tai su dung noi dung template tu lan truoc, va tuyet doi khong
chep noi dung template vao trong skill nay. Template la nguon su that duy nhat
cho cau truc spec; neu skill giu mot ban sao, sua template se khong phan anh
vao skill va repo co hai nguon su that lech nhau.

Neu can vi du da dien day du, doc `spec/entities/product.yaml`,
`spec/permissions/product.yaml`, `spec/acceptance/product.feature.md` — 4
entity that (`product`, `user`, `role`, `file`) chinh la thu template duoc rut
ra tu do.

## Buoc 3 — Sinh 3 file

Ghi dung 3 file, khong hon:

- `spec/entities/<name>.yaml`
- `spec/permissions/<name>.yaml`
- `spec/acceptance/<name>.feature.md`

Giu nguyen cau truc va cac comment huong dan cua template; thay placeholder
(`<EntityName>`, `<entity>`, `<ENTITY>`, `<fieldName>`, ...) bang gia tri that.
Bo comment huong dan cho muc **khong dung** (vd bo dong goi y `writeOnly` neu
entity khong co field write-only), giu comment giai thich cho muc co dung.

Rieng file acceptance co 3 quy uoc de sai nhat:

- Moi heading `##` (tru `## Out of scope`) bat dau bang `[AC-<ENTITY>-NN]`,
  NN la 2 chu so chay lien tuc tu `01`, khong trung nhau trong cung file.
- Ngay duoi moi heading do la mot dong `**Test:**`.
- Vi entity moi thi **code chua ton tai**, dong `**Test:**` mac dinh la:

  `**Test:** chua co, se verify thu cong luc implement`

  Dung tro toi file test chua ton tai, va dung tu bia ra test da co.

Template duoc viet de **mo ta code dang chay** (4 entity that duoc rut ra tu do),
nen co nhung cau nhu "Map 1:1 tu code dang chay" hay "Mo ta hanh vi that cua ...
tai thoi diem viet spec". Voi entity moi thi code chua ton tai: doi cac cau do
thanh dang **du dinh** (vd "Mo ta hanh vi DU KIEN cua `apps/api/src/modules/<module>/`
— chua implement") thay vi de nguyen, de nguoi doc sau khong tuong spec nay da
duoc doi chieu voi code that.

Moi action ngoai CRUD o Buoc 1.4 duoc mot heading rieng, giu dung dang
`## [AC-<ENTITY>-NN] <METHOD> <path> — <ten> (\`<permission-key>\`)`, va mot
dong tuong ung trong `permissions/<name>.yaml`.

Sau khi ghi xong, chay `pnpm spec:check <name>` de tu kiem cau truc 3 file vua
sinh (script kiem su ton tai cua file, AC-ID, dong `**Test:**`). Neu script bao
loi, sua file vua sinh cho dung roi chay lai.

## Buoc 4 — Bao cao va nhac buoc tiep theo

Bao cao ngan, gom du 3 y:

1. **Da tao 3 file spec** — liet ke duong dan.
2. **Day moi la spec, chua co code.** Buoc tiep theo la implement, va module
   tham chieu chuan la:
   - Backend: `apps/api/src/modules/products/`
     (`product.controller.ts`, `product.service.ts`, `product.schema.ts`,
     `product.schema.test.ts`)
   - Frontend: `apps/admin-web/app/(app)/products/`
     (`page.tsx`, `new/`, `[id]/`, `[id]/edit/`, `schema.ts`, `api.ts`,
     `permissions.ts`, `actions.ts`)

   Implement con can them model vao `prisma/schema.prisma`, permission key vao
   `apps/api/src/seed.ts`, va mot migration — nhung do la viec cua buoc sau,
   khong lam trong skill nay.
3. **Spec nay CHUA duoc duyet.** Noi ro rang nguoi dung can doc lai va duyet
   truoc khi coi entity la Definition of Ready va bat dau code. Dung viet
   "spec da duyet"/"da san sang" trong bat ky file nao vua sinh.

## Ranh gioi

- **Chi sinh spec, khong sinh code.** Spec la contract duoc review; sinh luon
  ca code se khien nguoi dung review code thay vi review contract, va dung
  luc contract con sai thi code da di theo cai sai do.
- **Khong tu danh dau spec la da duyet.** Theo AI Guardrails cua repo, chi
  spec da duyet moi duoc implement, va nguoi duyet phai la con nguoi.
- **Khong sua template, khong sua spec cua entity khac.** Neu thay template
  thieu cho can cho entity nay, bao conflict cho nguoi dung quyet dinh, dung
  tu them muc moi vao template.
- **Khong tao ADR mac dinh.** `decisions/_template.md` chi dung khi co mot
  quyet dinh kien truc that su can luu lai — khong phai entity nao cung can.
