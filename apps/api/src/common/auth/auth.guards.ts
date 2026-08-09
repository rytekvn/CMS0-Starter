// Auth guard mirror `requireAuth` + `requirePermission` cua legacy.
// ponytail: verify JWT bang jsonwebtoken truc tiep, khong Passport (1 dep thay vi 4);
// query user moi request, chua cache - them khi do duoc la cham.
import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  type CanActivate,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import jwt from "jsonwebtoken";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { can } from "./can";
import { userWithPermissions, type AuthUser } from "./auth.types";

// Phai KHOP apps/api-legacy/.env - legacy con so huu /auth/login, lech secret
// thi moi request deu 401 "Invalid token".
const SECRET = process.env.JWT_SECRET ?? "";
if (!SECRET) throw new Error("JWT_SECRET chua duoc set - xem .env.example");

type RequestWithUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;
    const token = typeof header === "string" ? header.replace("Bearer ", "") : "";
    if (!token) throw new UnauthorizedException({ error: "Unauthorized" });

    let userId: string;
    try {
      userId = (jwt.verify(token, SECRET) as { userId: string }).userId;
    } catch {
      throw new UnauthorizedException({ error: "Invalid token" });
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: userWithPermissions,
    });
    if (!user) throw new UnauthorizedException({ error: "Unauthorized" });

    request.user = user;
    return true;
  }
}

const PERMISSION_KEY = "permission";

export const RequirePermission = (key: string): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSION_KEY, key);

// Dung sau JwtAuthGuard. Handler khong gan @RequirePermission thi khong chan.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const key = this.reflector.get<string | undefined>(PERMISSION_KEY, context.getHandler());
    if (!key) return true;

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user || !can(user, key)) throw new ForbiddenException({ error: "Forbidden" });
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<Required<RequestWithUser>>().user
);
