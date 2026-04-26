import { Metadata } from "next";
import LoginClient from "./login-client";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Knivik account to access your AI lead dashboard and manage your social intelligence monitors.",
};

export default function LoginPage() {
  return <LoginClient />;
}
