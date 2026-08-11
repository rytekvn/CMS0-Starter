// Ky/verify JWT cho phien dang nhap. Noi DUY NHAT doc JWT_SECRET.
// Payload `{ userId }`, expiresIn 7d. Doi secret -> moi token dang luu hanh het hieu luc.
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
