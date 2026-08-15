import { Metadata } from "next";
import VerifyEmailClient from "./verify-email-client";
import { MetadataService } from "@/lib/seo";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Verify Email",
  description: "Verify your email address to activate your Knivik account and start finding high-intent leads.",
  path: "/verify-email",
  noIndex: true,
});

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
