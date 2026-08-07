// Route guard - chan truy cap khi chua dang nhap.
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "./useCurrentUser";

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useCurrentUser();
  // Con dang goi /auth/me: chua biet co dang nhap hay khong -> dung redirect voi.
  if (loading) return <div className="page-loading">Dang tai...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
