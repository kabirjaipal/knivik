import { Metadata } from "next";
import ResetPasswordClient from "./reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Knivik account. Ensure your account is secure with a strong password.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
