// Check nho cho logic phan quyen (khong can DB): npx tsx src/permissions/can.test.ts
import assert from "node:assert/strict";
import { can } from "./can";
import type { AuthUser } from "../types";

const user = (roles: unknown) => ({ roles }) as unknown as AuthUser;

const activeRole = {
  role: { deletedAt: null, permissions: [{ key: "product.create" }] },
};
const deletedRole = {
  role: { deletedAt: new Date(), permissions: [{ key: "user.delete" }] },
};

assert.equal(can(user([activeRole]), "product.create"), true);
assert.equal(can(user([activeRole]), "product.delete"), false);
assert.equal(can(user([]), "product.create"), false);
// Role da soft delete thi khong con cap quyen.
assert.equal(can(user([deletedRole]), "user.delete"), false);

console.log("can() ok");
