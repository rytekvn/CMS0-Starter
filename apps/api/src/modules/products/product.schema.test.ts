// Cho DUY NHAT logic bi sua khi port tu legacy sang Nest (strip query rong doi tu
// route vao schema) -> can test rieng. Chay: pnpm --filter @rytek/api test
import assert from "node:assert/strict";
import { bulkActionSchema, productQuerySchema } from "./product.schema";

// "yyyy-mm-dd" o createdTo = HET ngay do, khong phai 00:00.
assert.deepEqual(
  productQuerySchema.parse({ createdTo: "2026-01-31" }).createdTo,
  new Date("2026-01-31T23:59:59.999Z")
);
// createdFrom khong bi doi: van la dau ngay.
assert.deepEqual(
  productQuerySchema.parse({ createdFrom: "2026-01-01" }).createdFrom,
  new Date("2026-01-01T00:00:00.000Z")
);

// Form gui "?status=" khi chua chon gi -> coi nhu khong loc, khong bao loi.
assert.deepEqual(productQuerySchema.parse({ status: "", search: "", createdTo: "" }), {});
// Nhung gia tri that thi van giu.
assert.deepEqual(productQuerySchema.parse({ status: "active", search: "" }), {
  status: "active",
});

// ids: >= 1 va <= 500.
assert.equal(bulkActionSchema.safeParse({ ids: [], action: "delete" }).success, false);
assert.equal(
  bulkActionSchema.safeParse({ ids: Array(501).fill("x"), action: "delete" }).success,
  false
);
assert.equal(
  bulkActionSchema.safeParse({ ids: Array(500).fill("x"), action: "delete" }).success,
  true
);

console.log("product.schema ok");
