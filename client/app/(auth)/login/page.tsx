import { Metadata } from "next";
import LoginClient from "./login-client";
import { MetadataService } from "@/lib/seo/application/metadata.service";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Login",
  description: "Sign in to your Knivik account to access your AI lead dashboard and manage your social intelligence monitors.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginClient />;
}
