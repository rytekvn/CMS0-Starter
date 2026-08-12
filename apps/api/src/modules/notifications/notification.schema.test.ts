// Payload job la contract giua 2 process (producer va worker co the chay o 2 ban
// deploy khac nhau) -> khoa lai bang test. Chay: pnpm --filter @rytek/api test
import assert from "node:assert/strict";
import { WELCOME_JOB_OPTIONS, welcomeJobSchema } from "./notification.schema";

assert.deepEqual(welcomeJobSchema.parse({ v: 1, userId: "u1" }), { v: 1, userId: "u1" });
assert.deepEqual(welcomeJobSchema.parse({ v: 1, userId: "u1", requestId: "r1" }), {
  v: 1,
  userId: "u1",
  requestId: "r1",
});

// Version la nguon chinh: payload cua ban deploy sau (v2) khong duoc worker cu
// nuot bua -> processor nem UnrecoverableError thay vi retry 3 lan vo ich.
assert.equal(welcomeJobSchema.safeParse({ v: 2, userId: "u1" }).success, false);
assert.equal(welcomeJobSchema.safeParse({ userId: "u1" }).success, false);
assert.equal(welcomeJobSchema.safeParse({ v: 1 }).success, false);
assert.equal(welcomeJobSchema.safeParse({ v: 1, userId: "" }).success, false);

// Khong co `timeout` (Bull 3 cu), va phai co gioi han giu job de Redis khong phinh.
assert.equal("timeout" in WELCOME_JOB_OPTIONS, false);
assert.equal(WELCOME_JOB_OPTIONS.attempts, 3);
assert.deepEqual(WELCOME_JOB_OPTIONS.removeOnComplete, { count: 100 });
assert.deepEqual(WELCOME_JOB_OPTIONS.removeOnFail, { count: 1000 });

console.log("notification.schema ok");
