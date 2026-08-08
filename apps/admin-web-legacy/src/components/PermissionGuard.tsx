// Chi render children neu user co permission - doi ung voi can() ben api.
// ponytail: khong co quyen = an han (khong render). Can "disable thay vi an" thi
// dung useCurrentUser().can(...) truc tiep de set prop disabled.
import type { ReactNode } from "react";
import { useCurrentUser } from "../auth/useCurrentUser";

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = useCurrentUser();
  return <>{can(permission) ? children : fallback}</>;
}
