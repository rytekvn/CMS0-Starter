// Ky/verify JWT cho phien dang nhap. Noi DUY NHAT trong apps/api doc JWT_SECRET.
//
// Phai KHOP apps/api-legacy/src/auth/jwt.ts (cung secret, cung payload `{ userId }`,
// cung expiresIn): hai stack chay song song va doc chung mot bang User, nen token
// ky o ben nao cung dung duoc o ben kia. Rang buoc nay bien mat khi xoa apps/*-legacy.
// ponytail: sign/verify goi thang jsonwebtoken, chua co refresh token flow (them khi can)
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "";
if (!SECRET) throw new Error("JWT_SECRET chua duoc set - xem .env.example");

export function signToken(payload: { userId: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

// Nem khi token sai/het han -> caller doi thanh 401.
export function verifyUserId(token: string): string {
  return (jwt.verify(token, SECRET) as { userId: string }).userId;
}
