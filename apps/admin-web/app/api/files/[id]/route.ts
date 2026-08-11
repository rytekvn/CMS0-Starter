// Proxy tai file: <a href> khong gui duoc header Authorization, va token nam trong
// cookie httpOnly nen client cung khong doc duoc -> di vong qua server 1 nhip.
import { apiFetch } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const upstream = await apiFetch(`/files/${encodeURIComponent(id)}`);

  if (!upstream.ok)
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });

  // Forward .body (stream) chu KHONG .text() nhu route export CSV: .text() decode
  // UTF-8 -> hong moi file nhi phan (png/pdf).
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": upstream.headers.get("content-disposition") ?? "attachment",
    },
  });
}
