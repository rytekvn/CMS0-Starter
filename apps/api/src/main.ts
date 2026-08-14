// Thu tu import quan trong: "./common/env" phai dung dau. Xem giai thich trong file do.
import "./common/env";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { logging } from "./common/logging";
import { metrics } from "./common/metrics";
import { setupSwagger } from "./common/swagger";

// CORS: khong bat. apps/admin-web goi apps/api tu server (Next.js Server
// Component/Action doc token tu cookie httpOnly), khong co fetch tu browser
// JS toi day - xem comment trong apps/admin-web/lib/api.ts. Bat CORS voi
// origin whitelist se la config cho use case chua ton tai.
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(logging);
  // Truoc routing -> do duoc ca 404 va cac response bi guard chan (401/429).
  app.use(metrics);
  // CSP mac dinh cua helmet chan inline script/style ma Swagger UI can ->
  // tat CSP khi /docs con bat (dev), giu nguyen (mac dinh) o production vi
  // /docs da tat o do.
  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false }));
  if (process.env.NODE_ENV !== "production") setupSwagger(app);
  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();
