// Panel filter dung chung (vd filter theo status).
import type { ReactNode } from "react";

export function FilterPanel({ children }: { children?: ReactNode }) {
  return <div className="filter-panel">{children}</div>;
}
