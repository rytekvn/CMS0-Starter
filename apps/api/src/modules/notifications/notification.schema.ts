// Contract giua producer (NotificationService) va consumer (NotificationProcessor).
// Payload job KHONG di qua ZodValidationPipe (khong phai input HTTP) nen processor
// tu parse - xem notification.processor.ts.
import type { JobsOptions } from "bullmq";
import { z } from "zod";

export const QUEUE_NAME = "notification";
export const WELCOME_JOB = "user.welcome";

// `v` la version payload: doi shape thi tang v va cho processor xu ly ca 2 ban
// trong mot dot deploy. Job cu con nam trong Redis luc deploy ban moi.
// Chi mang userId, khong mang ca user: du lieu trong job co the cu khi worker
// chay, processor tu doc lai neu can.
export const welcomeJobSchema = z.object({
  v: z.literal(1),
  userId: z.string().min(1),
  requestId: z.string().optional(),
});

export type WelcomeJob = z.infer<typeof welcomeJobSchema>;

// KHONG co option `timeout`: do la Bull 3 cu, BaseJobOptions cua bullmq 5 khong
// con field nay. Co che that la lock renewal + stalledInterval/maxStalledCount
// o phia Worker. Dung di tim `timeout` o day.
export const WELCOME_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  // Gioi han so job giu lai de Redis khong phinh. Job failed giu nhieu hon vi
  // do la thu can dieu tra; day cung la "dead letter" - khong tao queue DLQ rieng.
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 1000 },
} satisfies JobsOptions;
