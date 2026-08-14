// Metrics dang Prometheus text format — vendor-neutral, moi backend
// observability (Prometheus, Grafana Cloud, Datadog agent, VictoriaMetrics...)
// deu scrape duoc. Xem ADR-0004.
import { collectDefaultMetrics, Histogram, Registry } from "prom-client";

// Registry rieng thay vi global `register`: registry global la singleton toan
// process, `pnpm test` import file nay nhieu lan se cham vao cung mot state.
export const metricsRegistry = new Registry();

// Process metrics cua Node (CPU, heap, event loop lag, GC) — mien phi, khong
// phai viet dong nao.
collectDefaultMetrics({ register: metricsRegistry });

// Chi mot histogram: `_count` cua no da la request count, `_sum` da la tong
// thoi gian. Them mot Counter rieng se la series thu hai noi cung mot dieu.
// Bucket dung mac dinh cua prom-client (0.005s -> 10s) — hop cho HTTP API.
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Thoi gian xu ly HTTP request (giay)",
  labelNames: ["method", "route", "status"],
  registers: [metricsRegistry],
});

// Chi lay du thu can dung: chu ky nay khop voi Request/Response cua Express
// theo structural typing, va cho phep test dung fake object khong can boot Nest.
type MetricsRequest = { method?: string; route?: { path?: string } };
type MetricsResponse = { statusCode: number; on(event: "finish", listener: () => void): unknown };

// `req.route.path` la path DA DANG KY ("/products/:id"), khong phai URL that
// ("/products/abc-123"). Bat buoc phai vay: dan URL that vao label se sinh mot
// time series moi cho moi id -> no bo nho cua ca app lan backend metrics.
// Request khong khop route nao (404, request bi chan truoc khi routing) khong co
// `req.route` -> gom het vao "unknown", cung ly do.
export function routeLabel(req: MetricsRequest): string {
  return req.route?.path ?? "unknown";
}

// Middleware Express (dat truoc routing trong main.ts) chu khong phai Nest
// interceptor: interceptor chay SAU guard nen se bo sot 429 cua ThrottlerGuard,
// 401 cua JwtAuthGuard va toan bo 404.
export function metrics(req: MetricsRequest, res: MetricsResponse, next: () => void): void {
  const done = httpRequestDuration.startTimer();
  res.on("finish", () => {
    done({ method: req.method ?? "unknown", route: routeLabel(req), status: res.statusCode });
  });
  next();
}
