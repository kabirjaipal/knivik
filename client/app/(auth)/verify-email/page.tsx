import { Metadata } from "next";
import VerifyEmailClient from "./verify-email-client";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address to activate your Knivik account and start finding high-intent leads.",
};

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
