// Producer duy nhat cua queue `notification`. Module khac (UserModule) di qua
// service nay, khong tu inject Queue.
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import {
  QUEUE_NAME,
  WELCOME_JOB,
  WELCOME_JOB_OPTIONS,
  type WelcomeJob,
} from "./notification.schema";

@Injectable()
export class NotificationService {
  constructor(@InjectQueue(QUEUE_NAME) private readonly queue: Queue) {}

  // NEM loi khi Redis chet - nguoi goi tu quyet dinh coi do la loi hay bo qua.
  // UserService.create bo qua (bat + log) vi user da ghi vao DB roi.
  async enqueueWelcome(userId: string, requestId?: string): Promise<void> {
    const payload: WelcomeJob = { v: 1, userId, requestId };
    await this.queue.add(WELCOME_JOB, payload, WELCOME_JOB_OPTIONS);
  }
}
