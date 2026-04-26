import { Metadata } from "next";
import ForgotPasswordClient from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Recover your Knivik account password. Enter your email and we'll send you instructions to reset your password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
