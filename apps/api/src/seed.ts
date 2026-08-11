// Seed: 4 role mac dinh + permission mau + 1 super admin.
// Chay: pnpm db:seed (idempotent, chay lai duoc nhieu lan).
// ponytail: file nam trong apps/api/src/ chu khong phai prisma/ vi thu muc prisma/
// o repo root khong co package.json/node_modules -> import "@prisma/client" tu do
// se khong resolve duoc.
// Chay bang tsx nhu mot script CLI doc lap, khong qua Nest DI -> dung thang
// PrismaClient chu khong phai PrismaService.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSION_KEYS = [
  "user.read",
  "user.create",
  "user.update",
  "user.delete",
  "role.read",
  "role.create",
  "role.update",
  "role.delete",
  "product.read",
  "product.create",
  "product.update",
  "product.delete",
  "product.import",
  "product.export",
  "product.bulk",
  "file.upload",
  "file.read",
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: PERMISSION_KEYS,
  admin: PERMISSION_KEYS.filter((k) => !k.startsWith("role.") || k === "role.read"),
  // staff xuat file va upload duoc, nhung khong import/bulk (ghi hang loat -> de admin lam).
  staff: [
    "user.read",
    "role.read",
    "product.read",
    "product.create",
    "product.update",
    "product.export",
    "file.upload",
    "file.read",
  ],
  viewer: PERMISSION_KEYS.filter((k) => k.endsWith(".read")),
};

async function main(): Promise<void> {
  for (const key of PERMISSION_KEYS) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }

  for (const [name, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const permissions = { set: keys.map((key) => ({ key })) };
    await prisma.role.upsert({
      where: { name },
      update: { permissions, deletedAt: null },
      create: { name, permissions: { connect: keys.map((key) => ({ key })) } },
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@rytek.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const superAdmin = await prisma.role.findUniqueOrThrow({ where: { name: "super_admin" } });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Super Admin", password: await bcrypt.hash(password, 10) },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdmin.id } },
    update: { deletedAt: null },
    create: { userId: user.id, roleId: superAdmin.id },
  });

  console.log(`Seed xong. Super admin: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
