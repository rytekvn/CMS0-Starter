import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import { logger } from "../../common/logging";

// Client Redis danh RIENG cho cache. BullMQ mo connection rieng (xem ADR-0002):
// worker cua BullMQ BUOC PHAI dung `maxRetriesPerRequest: null` (blocking command
// phai retry vo han) - neu cache dung chung client do thi Redis chet se lam
// `cache.get()` trong JwtAuthGuard treo vo han, moi request co token dung hinh.
//
// Cache phai nguoc lai: FAIL NHANH de guard degrade ve DB.
// - maxRetriesPerRequest: 1  -> lenh that bai sau 1 lan thu lai, khong treo.
// - enableOfflineQueue: false -> lenh gui luc mat ket noi reject ngay,
//   khong xep hang cho toi khi reconnect.
// Doc mot lan o day de cache va BullMQ (app.module.ts) khong lech default.
// An toan vi main.ts nap .env ("./common/env") truoc khi cham toi module nao.
export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    super(REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    // BUOC PHAI co: ioredis phat "error" tren EventEmitter, khong bat thi Node
    // nem unhandled 'error' event va sap ca process khi Redis down.
    // Log warn chu khong error: cache chet la degrade, khong phai su co.
    this.on("error", (err: Error) => {
      logger.warn({ err: err.message }, "redis cache connection error");
    });
  }

  async onModuleDestroy(): Promise<void> {
    // quit() reject neu chua bao gio ket noi duoc -> disconnect() la duong lui.
    await this.quit().catch(() => this.disconnect());
  }
}
