import { Metadata } from "next";
import { MetadataService } from "@/lib/seo/application/metadata.service";
import ContactClient from "./ContactClient";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Contact Us",
  description: "Have questions about Knivik? Get in touch with our team for support or business inquiries. We're here to help you find your next customer.",
  path: "/contact",
});

export default function Contact() {
  return <ContactClient />;
}
