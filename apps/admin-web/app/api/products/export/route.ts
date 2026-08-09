// Proxy tai CSV: <a href> khong gui duoc header Authorization, va token nam trong
// cookie httpOnly nen client cung khong doc duoc -> di vong qua server 1 nhip.
import { apiFetch } from "@/lib/api";

export async function GET(request: Request): Promise<Response> {
  const upstream = await apiFetch(`/products/export${new URL(request.url).search}`);
  const body = await upstream.text();

  if (!upstream.ok)
    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="products.csv"',
    },
  });
}
