// Rui ro that cua metrics khong phai "co so hay khong" ma la **label**: dan URL
// that vao label `route` se sinh mot time series moi cho moi id — no bo nho app
// va lam hong ca backend metrics. Test giu chac cho do.
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { metrics, metricsRegistry, routeLabel } from "./metrics";

// Route da khop -> lay path DA DANG KY, khong phai URL that.
assert.equal(routeLabel({ method: "GET", route: { path: "/products/:id" } }), "/products/:id");
// Khong khop route nao (404, bi chan truoc routing) -> gom vao "unknown".
assert.equal(routeLabel({ method: "GET" }), "unknown");

// tsconfig cua apps/api build ra CommonJS -> khong dung duoc top-level await.
async function main(): Promise<void> {
  const res = Object.assign(new EventEmitter(), { statusCode: 404 });
  let nextCalled = false;
  metrics({ method: "GET" }, res, () => {
    nextCalled = true;
  });

  // Middleware phai tra quyen dieu khien ngay, va chua ghi gi khi response
  // chua ket thuc (do sai cho nay = do thoi gian den luc handler bat dau).
  assert.equal(nextCalled, true);
  const before = await metricsRegistry.metrics();
  assert.equal(before.includes("http_request_duration_seconds_count"), false);

  res.emit("finish");
  const after = await metricsRegistry.metrics();
  assert.match(
    after,
    /http_request_duration_seconds_count\{method="GET",route="unknown",status="404"\} 1/
  );

  console.log("metrics ok");
}

void main();
