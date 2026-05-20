import { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "./login-client";
import { MetadataService } from "@/lib/seo/application/metadata.service";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Login",
  description: "Sign in to your Knivik account to access your AI lead dashboard and manage your social intelligence monitors.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
