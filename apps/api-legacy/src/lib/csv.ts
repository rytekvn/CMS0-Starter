// CSV toi thieu cho import/export: co quoted field ("a,b") va escape dau nhay ("").
// Du cho Product (name/status) nen khong them thu vien.
// ponytail: xu ly ca chuoi trong RAM - doi sang stream neu file len vai chuc MB.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  // Bo BOM cua Excel neu co.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (quoted) {
      if (ch !== '"') field += ch;
      else if (src[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const escapeCell = (value: unknown): string => {
  const s = value === null || value === undefined ? "" : String(value);
  return /["\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(escapeCell).join(",")).join("\n");
}
