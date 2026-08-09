"use client";

// Sidebar navigation - them menu item khi co module moi.
// Quyen do server quyet dinh va truyen xuong bang prop (khong co PermissionGuard
// phia client: server da biet permissions roi, khong can hoi lai).
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar({ canReadProducts }: { canReadProducts: boolean }) {
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
      </nav>
    </aside>
  );
}
