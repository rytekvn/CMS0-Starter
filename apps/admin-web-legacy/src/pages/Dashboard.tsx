import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { useCurrentUser } from "../auth/useCurrentUser";
import { listProducts } from "../modules/products/api";
import { productPermissions } from "../modules/products/permissions";

export function Dashboard() {
  const { user, can } = useCurrentUser();
  const [stats, setStats] = useState<{ total: number; active: number } | null>(null);

  useEffect(() => {
    if (!can(productPermissions.read)) return;
    listProducts()
      .then((products) =>
        setStats({
          total: products.length,
          active: products.filter((p) => p.status === "active").length,
        })
      )
      .catch(() => setStats(null));
  }, [can]);

  return (
    <div>
      <PageHeader title="Dashboard" />
      <p>Xin chao, {user?.name}.</p>
      {stats && (
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span>Products</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.active}</span>
            <span>Dang active</span>
          </div>
        </div>
      )}
    </div>
  );
}
