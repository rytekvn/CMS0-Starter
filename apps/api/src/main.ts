import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { logging } from "./common/logging";

async function bootstrap(): Promise<void> {
  // node >= 20.12 doc .env san, khong can dotenv. Khong co .env thi bo qua
  // (production dung env that cua container).
  try {
    process.loadEnvFile();
  } catch {
    // khong co .env
  }

  const app = await NestFactory.create(AppModule);
  app.use(logging);
  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();
