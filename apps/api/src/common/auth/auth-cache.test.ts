// Khoa 2 rui ro that cua cache auth (chay: pnpm --filter @rytek/api test):
// 1. JSON round-trip lam Date -> string: `can()`/`permissionKeys()` PHAI cho ket
//    qua y het truoc va sau khi qua cache.
// 2. Redis chet: moi ham phai degrade im lang, khong nem loi len guard.
// Dung fake in-memory nen khong can Redis that trong CI.
import assert from "node:assert/strict";
import { authUserKey, cacheUser, getCachedUser, invalidateUsers, type CacheClient } from "./auth-cache";
import type { AuthUser } from "./auth.types";
import { can, permissionKeys } from "./can";

const now = new Date("2026-08-12T10:00:00.000Z");
const stamps = { createdAt: now, updatedAt: now, createdBy: null, updatedBy: null, deletedAt: null };

const user: AuthUser = {
  id: "u1",
  email: "a@b.c",
  password: "hash",
  name: "A",
  ...stamps,
  roles: [
    {
      id: "ur1",
      userId: "u1",
      roleId: "r1",
      ...stamps,
      role: {
        id: "r1",
        name: "admin",
        ...stamps,
        permissions: [{ id: "p1", key: "user.create", ...stamps }],
      },
    },
    // Role da soft delete: khong duoc cap quyen, ke ca sau round-trip
    // (deletedAt la chuoi ISO chu khong con la Date).
    {
      id: "ur2",
      userId: "u1",
      roleId: "r2",
      ...stamps,
      role: {
        id: "r2",
        name: "ghost",
        ...stamps,
        deletedAt: now,
        permissions: [{ id: "p2", key: "user.delete", ...stamps }],
      },
    },
  ],
};

function fakeCache(): CacheClient & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    get: (key) => Promise.resolve(store.get(key) ?? null),
    setex: (key, _seconds, value) => Promise.resolve(store.set(key, value)),
    del: (...keys) => Promise.resolve(keys.filter((k) => store.delete(k)).length),
  };
}

const deadCache: CacheClient = {
  get: () => Promise.reject(new Error("ECONNREFUSED")),
  setex: () => Promise.reject(new Error("ECONNREFUSED")),
  del: () => Promise.reject(new Error("ECONNREFUSED")),
};

assert.equal(authUserKey("u1"), "auth:user:v1:u1");

// tsconfig cua apps/api build ra CommonJS -> khong dung duoc top-level await.
async function main(): Promise<void> {
  const cache = fakeCache();

  // Chua cache -> null (guard se query DB).
  assert.equal(await getCachedUser(cache, "u1"), null);

  await cacheUser(cache, user);
  const cached = await getCachedUser(cache, "u1");
  assert.ok(cached);

  // Hanh vi phan quyen KHONG duoc lech giua cache-hit va cache-miss.
  assert.equal(cached.id, user.id);
  assert.equal(can(cached, "user.create"), can(user, "user.create"));
  assert.equal(can(cached, "user.delete"), can(user, "user.delete"));
  assert.equal(can(cached, "user.delete"), false); // role soft delete khong cap quyen
  assert.deepEqual(permissionKeys(cached), permissionKeys(user));
  assert.deepEqual(permissionKeys(cached), ["user.create"]);

  // Invalidate xoa dung key, khong dung toi key khac.
  await cacheUser(cache, { ...user, id: "u2" });
  await invalidateUsers(cache, ["u1"]);
  assert.equal(await getCachedUser(cache, "u1"), null);
  assert.ok(await getCachedUser(cache, "u2"));

  // Mang rong: khong duoc goi del() voi 0 key (ioredis se nem loi cu phap).
  await invalidateUsers({ ...cache, del: () => Promise.reject(new Error("khong duoc goi")) }, []);

  // Redis chet: doc tra null (rot ve DB), ghi/xoa khong nem loi len tren.
  assert.equal(await getCachedUser(deadCache, "u1"), null);
  await cacheUser(deadCache, user);
  await invalidateUsers(deadCache, ["u1"]);

  console.log("auth-cache ok");
}

void main();
