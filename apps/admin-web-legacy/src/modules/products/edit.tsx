import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { getProduct, updateProduct } from "./api";
import type { Product } from "./schema";

export function ProductEdit() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Product["status"]>("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then((p) => {
        setName(p.name);
        setStatus(p.status);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await updateProduct(id, { name, status });
      navigate(`/products/${id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Luu that bai");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="page-loading">Dang tai...</p>;

  return (
    <div>
      <PageHeader title="Edit Product" />
      <form className="entity-form" onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <label>
          Ten
          <input value={name} onChange={(e) => setName(e.target.value)} required />
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
          <button type="button" onClick={() => navigate(`/products/${id}`)}>
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
