// Thong bao loi cua form / trang. Tach ra vi lap lai o ca 3 entity + login + uploader.
import type { ReactNode } from "react";

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-danger bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
      {children}
    </p>
  );
}
