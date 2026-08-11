// Khung layout cho moi trang da dang nhap. Verify token that o day (goi /auth/me),
// middleware chi lam viec redirect nhanh theo su ton tai cua cookie.
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/session";
import { productPermissions } from "./products/permissions";
import { rolePermissions } from "./roles/permissions";
import { userPermissions } from "./users/permissions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const has = (key: string) => user.permissions.includes(key);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        canReadProducts={has(productPermissions.read)}
        canReadUsers={has(userPermissions.read)}
        canReadRoles={has(rolePermissions.read)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
