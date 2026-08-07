import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { createProduct } from "./api";
import type { Product } from "./schema";

export function ProductCreate() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Product["status"]>("active");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const product = await createProduct({ name, status });
      navigate(`/products/${product.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tao that bai");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="New Product" />
      <form className="entity-form" onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <label>
          Ten
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <label>
          Trang thai
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Product["status"])}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
        <div className="form-actions">
          <button type="button" onClick={() => navigate("/products")}>
            Huy
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? "Dang luu..." : "Luu"}
          </button>
        </div>
      </form>
    </div>
  );
}
