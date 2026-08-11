"use client";

// Sidebar navigation - them menu item khi co module moi.
// Quyen do server quyet dinh va truyen xuong bang prop (khong co PermissionGuard
// phia client: server da biet permissions roi, khong can hoi lai).
import { Package, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function NavLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-[9px] text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hover:no-underline",
        active &&
          "bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)]"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

export function Sidebar({
  canReadProducts,
  canReadUsers,
  canReadRoles,
}: {
  canReadProducts: boolean;
  canReadUsers: boolean;
  canReadRoles: boolean;
}) {
  return (
    <aside className="sticky top-0 h-screen w-58 shrink-0 overflow-y-auto border-r border-border bg-surface px-3.5 py-5 text-foreground">
      <div className="mb-2 border-b border-border/60 px-2.5 pt-1 pb-5 text-base font-bold text-foreground">
        Rytek CMS
      </div>
      <nav className="flex flex-col gap-0.5">
        {canReadProducts && <NavLink href="/products" icon={Package} label="Products" />}
        {canReadUsers && <NavLink href="/users" icon={Users} label="Users" />}
        {canReadRoles && <NavLink href="/roles" icon={ShieldCheck} label="Roles" />}
      </nav>
    </aside>
  );
}
