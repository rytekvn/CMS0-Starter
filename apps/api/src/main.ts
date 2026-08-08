// Thu tu import quan trong: "./common/env" phai dung dau. Xem giai thich trong file do.
import "./common/env";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { logging } from "./common/logging";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(logging);
  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();
