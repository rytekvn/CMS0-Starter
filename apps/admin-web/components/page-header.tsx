// Tieu de trang + action button (vd "+ Them moi").
import type { ReactNode } from "react";

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
