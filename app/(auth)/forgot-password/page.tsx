import { Metadata } from "next";
import ForgotPasswordClient from "./forgot-password-client";
import { MetadataService } from "@/lib/seo/application/metadata.service";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Forgot Password",
  description: "Recover your Knivik account password. Enter your email and we'll send you instructions to reset your password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
