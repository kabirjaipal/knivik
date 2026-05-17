import { Metadata } from "next";
import RegisterClient from "./register-client";
import { MetadataService } from "@/lib/seo/application/metadata.service";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Create Account",
  description: "Join Knivik today and start finding high-intent leads automatically across social platforms. Your next customer is waiting.",
  path: "/register",
});

export default function RegisterPage() {
  return <RegisterClient />;
}
