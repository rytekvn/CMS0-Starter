#!/usr/bin/env node
// Load test toi thieu cho apps/api bang autocannon (Node API, khong can binary
// ngoai, chi la 1 devDependency npm). Xem docs/runbooks/load-test.md.
//
// TARGET=products (mac dinh) - GET /products, endpoint doc nhieu nhat trong CMS.
// TARGET=health - GET /health/live, dung lam duong nen (khong cham DB/auth).
// TARGET=auth-throttle - kiem tra @Throttle 5 req/60s cua POST /auth/login hoat
//   dong dung (KHONG do throughput that: endpoint nay bi siet rieng nen load
//   test binh thuong chi do duoc rate limiter, khong do duoc business logic).
//
// Auth: truyen TOKEN (JWT co san) de tranh goi /auth/login lap lai trong luc
// tai (se dinh throttle 5/60s). Khong co TOKEN thi truyen EMAIL+PASSWORD - script
// login DUY NHAT MOT LAN truoc khi bat dau vong lap tai, khong lap lai.
import autocannon from "autocannon";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const DURATION = Number(process.env.DURATION ?? 20); // giay
const CONNECTIONS = Number(process.env.CONNECTIONS ?? 10);
const TARGET = process.env.TARGET ?? "products";
const PRODUCTS_QUERY = process.env.PRODUCTS_QUERY ?? ""; // vd "?status=active"

// Tach rieng de test duoc khong can goi mang (xem load-test.test.mjs).
export function resolveTarget(target, productsQuery = "") {
  if (target === "products") return { path: `/products${productsQuery}`, needsAuth: true };
  if (target === "health") return { path: "/health/live", needsAuth: false };
  throw new Error(`TARGET khong hop le: "${target}" (chi nhan products | health | auth-throttle)`);
}

async function loginOnce() {
  if (process.env.TOKEN) return process.env.TOKEN;
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Can bien moi truong TOKEN (JWT co san), hoac EMAIL + PASSWORD de script tu login mot lan."
    );
  }
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login that bai: ${res.status} ${await res.text()}`);
  const { token } = await res.json();
  return token;
}

async function runAuthThrottleCheck() {
  const result = await autocannon({
    url: `${API_URL}/auth/login`,
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "load-test-throttle-check@invalid.local", password: "wrong" }),
    connections: 5,
    duration: 5,
  });
  console.log(autocannon.printResult(result, { renderStatusCodes: true }));
  console.log(
    "Ky vong: vai request dau 401 (sai mat khau, chua bi chan), phan con lai 429 " +
      "(@Throttle 5 req/60s tren POST /auth/login chan). Day la hanh vi DUNG chu dich, khong phai bug."
  );
}

async function runLoadTest() {
  const { path, needsAuth } = resolveTarget(TARGET, PRODUCTS_QUERY);
  const token = needsAuth ? await loginOnce() : undefined;

  const result = await autocannon({
    url: `${API_URL}${path}`,
    connections: CONNECTIONS,
    duration: DURATION,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
  console.log(autocannon.printResult(result, { renderStatusCodes: true }));
}

async function main() {
  if (TARGET === "auth-throttle") return runAuthThrottleCheck();
  return runLoadTest(); // resolveTarget() nem loi neu TARGET khong hop le
}

// Chi chay khi goi truc tiep (`node scripts/load-test.mjs`), khong chay khi
// file nay duoc import boi test (xem load-test.test.mjs).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
