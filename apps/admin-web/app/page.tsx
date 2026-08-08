// Trang duy nhat cua skeleton: chung minh chuoi web -> api -> db chay that.
// Server component fetch thang sang NestJS, khong qua browser nen khong can CORS.
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

type Health = { status: string; db: string };

async function readApiHealth(): Promise<Health> {
  try {
    const res = await fetch(`${API_URL}/health/ready`, { cache: "no-store" });
    return (await res.json()) as Health;
  } catch {
    // API chua chay / khong noi duoc: khong crash trang, bao "down".
    return { status: "error", db: "unknown" };
  }
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <tr>
      <td style={{ padding: "8px 16px 8px 0", color: "var(--text-muted)" }}>{label}</td>
      <td style={{ padding: "8px 0", color: ok ? "var(--success)" : "var(--danger)" }}>{value}</td>
    </tr>
  );
}

export default async function Page() {
  const health = await readApiHealth();

  return (
    <main style={{ maxWidth: 480, margin: "64px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Rytek Admin</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Skeleton v0.3 &mdash; Next.js :3000 &rarr; NestJS :4000 &rarr; Postgres
      </p>

      <table
        style={{
          borderCollapse: "collapse",
          background: "var(--bg-card)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-card)",
          padding: 16,
          width: "100%",
        }}
      >
        <tbody>
          <Row label="web (Next.js)" value="up" ok />
          <Row label={`api (${API_URL})`} value={health.status} ok={health.status === "ok"} />
          <Row label="db (Postgres)" value={health.db} ok={health.db === "up"} />
        </tbody>
      </table>
    </main>
  );
}
