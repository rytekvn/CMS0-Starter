"use client";

// Header - breadcrumb, current user, doi theme, dang xuat.
import { useEffect, useState } from "react";
import { logout } from "@/app/login/actions";
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
    <header className="header">
      <Breadcrumb />
      <div className="header-user">
        <button type="button" className="theme-toggle" onClick={toggle} title="Doi giao dien">
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <span>
          {user.name}
          {user.roles.length ? ` (${user.roles.map((r) => r.role.name).join(", ")})` : ""}
        </span>
        {/* type="button" chu khong phai submit: CSS to mau primary cho submit. */}
        <button type="button" onClick={() => void logout()}>
          Dang xuat
        </button>
      </div>
    </header>
  );
}
