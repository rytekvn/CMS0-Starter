"use client";

// Breadcrumb - suy ra tu URL hien tai.
// ponytail: hien thang segment cua URL (id se hien nguyen chuoi id). Muon ten
// dep hon thi truyen label tu page xuong.
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Breadcrumb() {
  const segments = usePathname().split("/").filter(Boolean);

  return (
    <nav className="text-[13px] text-muted-foreground">
      {segments.map((segment, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={href}>
            {i > 0 && " / "}
            {isLast ? (
              segment
            ) : (
              <Link href={href} className="text-primary hover:underline">
                {segment}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
