// Doi loi quen thuoc thanh status dung, thay vi 500 chung chung.
// Giu nguyen format loi cua stack Hono cu (onError) tu truoc khi migrate.
import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import { Prisma } from "@prisma/client";

// Khai bao tai cho thay vi import type tu "express": express la dependency giao
// tiep cua @nestjs/platform-express, khong hoist len node_modules cua app nay.
type HttpResponse = { status(code: number): { json(body: unknown): void } };

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();

    // Guard/pipe da nem san object dung format -> tra nguyen van.
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2025") {
        response.status(404).json({ error: "Not found" });
        return;
      }
      if (exception.code === "P2002") {
        response.status(409).json({ error: "Duplicate value" });
        return;
      }
    }

    console.error(exception);
    response.status(500).json({ error: "Internal error" });
  }
}
