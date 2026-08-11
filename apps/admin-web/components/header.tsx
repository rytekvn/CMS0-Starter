"use client";

// Header - breadcrumb, current user, doi theme, dang xuat.
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/session";
import { Breadcrumb } from "./breadcrumb";

function useTheme() {
  const [theme, setTheme] = useState("light");

  // localStorage chi co o client -> doc sau khi mount (SSR khong co window).
  useEffect(() => setTheme(localStorage.getItem("theme") ?? "light"), []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

export function Header({ user }: { user: CurrentUser }) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface px-8 py-3.5">
      <Breadcrumb />
      <div className="flex items-center gap-3 text-[13.5px] text-muted-foreground">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8.5 rounded-full"
          onClick={toggle}
          title="Doi giao dien"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <span>
          {user.name}
          {user.roles.length ? ` (${user.roles.map((r) => r.role.name).join(", ")})` : ""}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={() => void logout()}>
          Dang xuat
        </Button>
      </div>
    </header>
  );
}
