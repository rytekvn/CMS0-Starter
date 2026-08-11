"use client";

// Sidebar navigation - them menu item khi co module moi.
// Quyen do server quyet dinh va truyen xuong bang prop (khong co PermissionGuard
// phia client: server da biet permissions roi, khong can hoi lai).
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar({
  canReadProducts,
  canReadUsers,
  canReadRoles,
}: {
  canReadProducts: boolean;
  canReadUsers: boolean;
  canReadRoles: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Rytek CMS</div>
      <nav>
        {canReadProducts && (
          <Link href="/products" className={isActive("/products") ? "active" : undefined}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Products
          </Link>
        )}
        {canReadUsers && (
          <Link href="/users" className={isActive("/users") ? "active" : undefined}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Users
          </Link>
        )}
        {canReadRoles && (
          <Link href="/roles" className={isActive("/roles") ? "active" : undefined}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            Roles
          </Link>
        )}
      </nav>
    </aside>
  );
}
