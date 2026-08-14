// Check cho logic chon target cua load-test.mjs (khong goi mang - xem
// docs/runbooks/load-test.md cho huong dan chay load test that).
import assert from "node:assert/strict";
import { resolveTarget } from "./load-test.mjs";

assert.deepEqual(resolveTarget("products"), { path: "/products", needsAuth: true });
assert.deepEqual(resolveTarget("products", "?status=active"), {
  path: "/products?status=active",
  needsAuth: true,
});
assert.deepEqual(resolveTarget("health"), { path: "/health/live", needsAuth: false });
assert.throws(() => resolveTarget("nope"), /TARGET khong hop le/);

console.log("load-test resolveTarget ok");
