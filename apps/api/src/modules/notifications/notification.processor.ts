// Worker chay IN-PROCESS trong apps/api (khong co apps/worker rieng - xem ADR-0002).
// Job hien chi log, dung cho de mo phong "gui thong bao chao mung".
import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, UnrecoverableError } from "bullmq";
import { logger } from "../../common/logging";
import { QUEUE_NAME, WELCOME_JOB, welcomeJobSchema } from "./notification.schema";

@Processor(QUEUE_NAME)
export class NotificationProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    // UnrecoverableError = fail ngay, khong dot 3 lan retry cho payload hong
    // vinh vien (sai shape / sai version thi retry bao nhieu lan cung the).
    if (job.name !== WELCOME_JOB) {
      throw new UnrecoverableError(`unknown job name: ${job.name}`);
    }
    const parsed = welcomeJobSchema.safeParse(job.data);
    if (!parsed.success) {
      throw new UnrecoverableError(`invalid ${WELCOME_JOB} payload: ${parsed.error.message}`);
    }

    // requestId noi log job voi request HTTP da sinh ra no (roadmap §7.7).
    logger.info(
      { jobId: job.id, userId: parsed.data.userId, requestId: parsed.data.requestId },
      "user.welcome sent"
    );
  }

  // Job failed nam san trong set `failed` cua BullMQ (khong tao DLQ rieng);
  // log de con thay no ma khong phai mo Redis len xem.
  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, err: Error): void {
    logger.error({ jobId: job?.id, name: job?.name, err: err.message }, "notification job failed");
  }
}
