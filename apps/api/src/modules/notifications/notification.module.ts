import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { NotificationProcessor } from "./notification.processor";
import { NotificationService } from "./notification.service";
import { QUEUE_NAME } from "./notification.schema";

// Connection Redis cua BullMQ khai bao o app.module.ts (BullModule.forRoot).
// exports NotificationService: UserModule enqueue qua service nay, khong tu
// inject Queue (luat "module di qua service duoc export").
@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAME })],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
