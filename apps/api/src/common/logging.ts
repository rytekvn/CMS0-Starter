import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";

// Request ID: lay tu header `x-request-id` neu client gui, khong thi tu sinh.
// Luon echo lai trong response header de trace duoc tu client sang log.
export const logging = pinoHttp({
  genReqId: (req, res) => {
    const incoming = req.headers["x-request-id"];
    const id = (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
});
