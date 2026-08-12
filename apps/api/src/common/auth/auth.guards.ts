// Auth guard: `requireAuth` + `requirePermission`.
// Token do ./jwt.ts ky va verify (1 noi so huu JWT_SECRET).
// ponytail: verify JWT bang jsonwebtoken truc tiep, khong Passport (1 dep thay vi 4).
// User+permissions doc qua cache Redis (cache-aside, TTL 60s) - xem
// ./auth-cache.ts va spec/decisions/ADR-0002-redis-cache-bullmq.md.
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
import { RedisService } from "../../infrastructure/cache/redis.service";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { cacheUser, getCachedUser } from "./auth-cache";
import { can } from "./can";
import { verifyUserId } from "./jwt";
import { userWithPermissions, type AuthUser } from "./auth.types";

type RequestWithUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;
    const token = typeof header === "string" ? header.replace("Bearer ", "") : "";
    if (!token) throw new UnauthorizedException({ error: "Unauthorized" });

    let userId: string;
    try {
      userId = verifyUserId(token);
    } catch {
      throw new UnauthorizedException({ error: "Invalid token" });
    }

    // Cache-aside: chi cache user CON SONG (deletedAt: null). Xoa mem / doi role /
    // doi quyen deu invalidate chu dong; TTL chi la luoi an toan.
    let user = await getCachedUser(this.redis, userId);
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: userWithPermissions,
      });
      if (!user) throw new UnauthorizedException({ error: "Unauthorized" });
      await cacheUser(this.redis, user);
    }

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
