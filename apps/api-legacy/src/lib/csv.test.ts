// Check nho cho parser CSV (khong can DB): npx tsx src/lib/csv.test.ts
import assert from "node:assert/strict";
import { parseCsv, toCsv } from "./csv";

assert.deepEqual(parseCsv("name,status\nAo,active"), [
  ["name", "status"],
  ["Ao", "active"],
]);

// Quoted field: dau phay, xuong dong va dau nhay escape nam trong 1 o.
assert.deepEqual(parseCsv('name\n"Ao, dai"\n"Say ""hi"""\n"hai\ndong"'), [
  ["name"],
  ["Ao, dai"],
  ['Say "hi"'],
  ["hai\ndong"],
]);

// CRLF cua Excel + BOM.
assert.deepEqual(parseCsv("﻿a,b\r\n1,2\r\n"), [
  ["a", "b"],
  ["1", "2"],
]);

assert.equal(toCsv([["id", "name"], ["1", 'Ao, "dai"']]), 'id,name\n1,"Ao, ""dai"""');

// Round-trip: ghi ra roi doc lai phai ra dung du lieu ban dau.
const data = [
  ["id", "name", "status"],
  ["c1", "Ao, dai\nmoi", "active"],
];
assert.deepEqual(parseCsv(toCsv(data)), data);

console.log("csv ok");
