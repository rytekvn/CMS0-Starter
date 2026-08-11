// Schema nay quyet dinh file nao duoc ghi vao disk -> test cac nhanh de sai.
// Chay: pnpm --filter @rytek/api test
import assert from "node:assert/strict";
import { EXT_BY_MIME, MAX_UPLOAD_BYTES, uploadSchema } from "./file.schema";

const ok = (over: Partial<{ filename: string; mimeType: string; size: number }> = {}) =>
  uploadSchema.safeParse({ filename: "a.png", mimeType: "image/png", size: 10, ...over });

// Browser gui mime kem charset -> van khop whitelist, va mimeType luu vao DB da bi cat.
assert.equal(ok({ filename: "a.csv", mimeType: "text/csv; charset=utf-8" }).data?.mimeType, "text/csv");
assert.equal(ok({ mimeType: "IMAGE/PNG" }).data?.mimeType, "image/png");

// `in` se cho "constructor" lot qua prototype chain -> EXT_BY_MIME[...] ra undefined
// va ten file tren disk thanh "<uuid>.undefined". Object.hasOwn chan tu vong loai.
assert.equal(ok({ mimeType: "constructor" }).success, false);
assert.equal(ok({ mimeType: "toString" }).success, false);
assert.equal(ok({ mimeType: "application/x-sh" }).success, false);

// Size: duong, nguyen, <= 5MB. Oversize la loi VALIDATE (400), khong phai 413.
assert.equal(ok({ size: MAX_UPLOAD_BYTES }).success, true);
assert.equal(
  ok({ size: MAX_UPLOAD_BYTES + 1 }).error?.issues[0].message,
  "File too large (max 5MB)"
);
assert.equal(ok({ size: 0 }).success, false);

// Filename rong / qua dai.
assert.equal(ok({ filename: "" }).success, false);
assert.equal(ok({ filename: "x".repeat(256) }).success, false);
assert.equal(ok({ filename: "x".repeat(255) }).success, true);

// Moi mime trong whitelist deu co duoi -> khong bao gio ghi file ".undefined".
for (const mime of Object.keys(EXT_BY_MIME)) {
  assert.equal(ok({ mimeType: mime }).success, true);
  assert.ok(EXT_BY_MIME[mime]);
}

console.log("file.schema ok");
