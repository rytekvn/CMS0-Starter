import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Gop className: clsx xu ly conditional, twMerge bo class Tailwind bi ghi de.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
