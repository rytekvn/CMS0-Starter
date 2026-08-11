import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Native <select> chu khong phai shadcn/Radix Select: Radix khong ho tro `multiple`
// va khong gui gia tri qua formData - hai thu form cua app dang dua vao.
// Chi style, khong boc state.
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        // multi-select tu gian theo `size`, chieu cao co dinh se cat mat option.
        "[&[multiple]]:h-auto [&[multiple]]:py-2",
        className
      )}
      {...props}
    />
  );
}
