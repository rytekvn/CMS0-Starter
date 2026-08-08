// Breadcrumb - suy ra tu route hien tai.
// ponytail: hien thang segment cua URL (id se hien nguyen chuoi id). Muon ten
// dep hon thi truyen label tu page xuong.
import { Link, useLocation } from "react-router-dom";

export function Breadcrumb() {
  const segments = useLocation().pathname.split("/").filter(Boolean);

  return (
    <nav className="breadcrumb">
      {segments.map((segment, i) => {
        const to = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={to}>
            {i > 0 && " / "}
            {isLast ? segment : <Link to={to}>{segment}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
