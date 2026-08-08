// Phai duoc import DAU TIEN trong main.ts, truoc bat ky module nao cham
// `@prisma/client`.
//
// Ly do: khi `@prisma/client` duoc require, no tu dong nap file `.env` nam canh
// `prisma/schema.prisma` da dung luc generate - o repo nay co the la
// `apps/api-legacy/.env` (PORT=3001, DATABASE_URL cua app khac). dotenv khong
// ghi de bien da ton tai, nen ai nap truoc thi thang. Nap .env cua chinh app nay
// truoc -> apps/api luon chay dung PORT/DATABASE_URL cua no.
//
// node >= 20.12 doc .env san, khong can dotenv.
try {
  process.loadEnvFile();
} catch {
  // Khong co .env (vd production dung env that cua container) -> bo qua.
}
