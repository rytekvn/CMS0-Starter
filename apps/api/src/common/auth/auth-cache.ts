// Cache-aside cho user+permissions ma JwtAuthGuard load moi request.
// Redis chet -> moi ham o day degrade im lang (log warn) va guard rot ve DB:
// cache la toi uu, khong phai duong song cua auth.
import { logger } from "../logging";
import type { AuthUser } from "./auth.types";

// Chi 3 lenh Redis that su can. `RedisService` (extends ioredis) khop
// structurally; test dung fake in-memory nen `pnpm test` khong can Redis that.
export type CacheClient = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
};

// Namespace + version theo roadmap §7.6: doi shape AuthUser thi tang v2,
// key cu tu het han, khong can flush tay.
export const authUserKey = (userId: string): string => `auth:user:v1:${userId}`;

// 60s la TRAN AN TOAN, khong phai co che chinh: moi duong ghi da biet
// (User.update/softDelete, Role.update/softDelete) deu invalidate chu dong.
// TTL chi phu cac duong khong kiem soat duoc - sua DB tay, `pnpm db:seed`.
const TTL_SECONDS = 60;

// JSON round-trip bien Date -> string, nen gia tri tra ve KHONG hoan toan dung
// kieu AuthUser. Da grep toan bo consumer cua request.user: chi doc `.id` va
// `role.deletedAt === null`, ca hai song sot qua round-trip (null van la null).
// auth-cache.test.ts khoa lai hanh vi nay.
export async function getCachedUser(
  cache: CacheClient,
  userId: string
): Promise<AuthUser | null> {
  try {
    const raw = await cache.get(authUserKey(userId));
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch (err) {
    logger.warn({ err: String(err), userId }, "auth cache read failed");
    return null;
  }
}

// Luu ca `password`: day la cache noi bo server, cung muc rui ro voi row dang
// nam trong Postgres. Strip di se lam nhanh cache-hit va cache-miss tra shape
// khac nhau - bug kho tim hon nhieu so voi rui ro no tranh duoc.
export async function cacheUser(cache: CacheClient, user: AuthUser): Promise<void> {
  try {
    await cache.setex(authUserKey(user.id), TTL_SECONDS, JSON.stringify(user));
  } catch (err) {
    logger.warn({ err: String(err), userId: user.id }, "auth cache write failed");
  }
}

export async function invalidateUsers(cache: CacheClient, userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  try {
    await cache.del(...userIds.map(authUserKey));
  } catch (err) {
    logger.warn({ err: String(err), userIds }, "auth cache invalidate failed");
  }
}
