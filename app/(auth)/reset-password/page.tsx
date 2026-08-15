import { Metadata } from "next";
import ResetPasswordClient from "./reset-password-client";
import { MetadataService } from "@/lib/seo";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Reset Password",
  description: "Set a new password for your Knivik account. Ensure your account is secure with a strong password.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
