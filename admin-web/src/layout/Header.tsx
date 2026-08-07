// Header - breadcrumb, current user, logout.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../auth/useCurrentUser";
import { Breadcrumb } from "./Breadcrumb";

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

export function Header() {
  const { user, logout } = useCurrentUser();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  return (
    <header className="header">
      <Breadcrumb />
      <div className="header-user">
        <button type="button" className="theme-toggle" onClick={toggle} title="Doi giao dien">
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <span>
          {user?.name}
          {user?.roles.length ? ` (${user.roles.map((r) => r.role.name).join(", ")})` : ""}
        </span>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          Dang xuat
        </button>
      </div>
    </header>
  );
}
