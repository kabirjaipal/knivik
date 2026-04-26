import { Metadata } from "next";
import RegisterClient from "./register-client";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Knivik today and start finding high-intent leads automatically across social platforms. Your next customer is waiting.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
