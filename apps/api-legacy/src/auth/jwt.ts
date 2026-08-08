// Ky/verify JWT cho phien dang nhap.
// ponytail: sign/verify goi thang jsonwebtoken, chua co refresh token flow (them khi can)
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "";
if (!SECRET) throw new Error("JWT_SECRET chua duoc set - xem .env.example");

export function signToken(payload: { userId: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as { userId: string };
}
