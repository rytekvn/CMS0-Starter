// User hien tai + permissions, lay tu GET /auth/me. Dung React context de moi
// component dung chung 1 lan goi API (Provider dat o App.tsx).
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "../api/client";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  roles: { role: { id: string; name: string } }[];
  permissions: string[];
};

export type AuthState = {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: string) => boolean;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useCurrentUser(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useCurrentUser phai nam trong AuthContext.Provider");
  return ctx;
}

// Chi goi 1 lan, o App.tsx.
export function useAuthState(): AuthState {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api<CurrentUser>("/auth/me")
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await api<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    setUser(await api<CurrentUser>("/auth/me"));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user]
  );

  return { user, loading, login, logout, can };
}
