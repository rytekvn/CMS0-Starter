// Check nho cho logic phan quyen (khong can DB): pnpm --filter @rytek/api test
import assert from "node:assert/strict";
import { can, permissionKeys } from "./can";
import type { AuthUser } from "./auth.types";

const user = (roles: unknown) => ({ roles }) as unknown as AuthUser;

const activeRole = {
  role: { deletedAt: null, permissions: [{ key: "product.create" }] },
};
const deletedRole = {
  role: { deletedAt: new Date(), permissions: [{ key: "user.delete" }] },
};
// Trung "product.create" voi activeRole -> kiem tra viec khu trung lap.
const secondRole = {
  role: { deletedAt: null, permissions: [{ key: "product.create" }, { key: "user.read" }] },
};

assert.equal(can(user([activeRole]), "product.create"), true);
assert.equal(can(user([activeRole]), "product.delete"), false);
assert.equal(can(user([]), "product.create"), false);
// Role da soft delete thi khong con cap quyen.
assert.equal(can(user([deletedRole]), "user.delete"), false);

assert.deepEqual(permissionKeys(user([])), []);
assert.deepEqual(permissionKeys(user([activeRole])), ["product.create"]);
// Gop nhieu role, bo trung lap.
assert.deepEqual(permissionKeys(user([activeRole, secondRole])), [
  "product.create",
  "user.read",
]);
// Cung phep duyet voi can(): role da soft delete khong dong gop key nao.
assert.deepEqual(permissionKeys(user([deletedRole])), []);
assert.deepEqual(permissionKeys(user([activeRole, deletedRole])), ["product.create"]);

console.log("can() ok");
