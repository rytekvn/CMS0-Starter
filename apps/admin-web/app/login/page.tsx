import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Dang nhap - Rytek Admin" };

export default function LoginPage() {
  return <LoginForm />;
}
