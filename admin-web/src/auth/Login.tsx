// Trang dang nhap - goi POST /auth/login, luu token, vao dashboard.
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCurrentUser } from "./useCurrentUser";

export function Login() {
  const { user, loading, login } = useCurrentUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="page-loading">Dang tai...</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dang nhap that bai");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <h1>Rytek CMS</h1>
      {error && <p className="form-error">{error}</p>}
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </label>
      <label>
        Mat khau
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Dang dang nhap..." : "Dang nhap"}
      </button>
    </form>
  );
}
