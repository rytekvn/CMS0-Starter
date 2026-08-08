// Fetch client dung chung: base URL tu env, tu dinh kem Bearer token, 401 -> ve /login.
// Moi module goi API qua day, dung fetch thang.
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Phan chung cua moi request: token, 401, loi HTTP. api()/apiBlob() chi khac cach doc body.
async function request(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const res = await fetch(BASE_URL + path, {
    ...init,
    headers: {
      // FormData tu set Content-Type kem boundary -> khong duoc de dan json vao.
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  // 401 khi DANG co token = het han/bi thu hoi -> dang xuat.
  // 401 luc chua co token (vd sai mat khau o /auth/login) roi xuong duoi de lay message that.
  if (res.status === 401 && token) {
    clearToken();
    window.location.assign("/login");
    throw new Error("Phien dang nhap da het han");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Loi ${res.status}`);
  }

  return res;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return (await request(path, init)).json() as Promise<T>;
}

// Endpoint tra ve bytes (export CSV, GET /files/:id).
export async function apiBlob(path: string, init?: RequestInit): Promise<Blob> {
  return (await request(path, init)).blob();
}

// <a href> khong gui duoc header Authorization -> tai bang fetch roi mo object URL.
export async function download(path: string, filename: string): Promise<void> {
  const url = URL.createObjectURL(await apiBlob(path));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke ngay sau click co the cat mat download tren mot so trinh duyet -> doi 1 tick.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
