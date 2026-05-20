import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { getSession } from "@/lib/auth-client";
import { headers } from "next/headers";
import { SchemaService } from "@/lib/seo/application/schema.service";
import { SchemaScript } from "@/components/seo/schema-script";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await getSession({
    fetchOptions: {
      headers: await headers()
    }
  });
  const user = session?.user;
  const softwareSchema = SchemaService.generateSoftwareApplicationSchema();

  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      <SchemaScript schema={softwareSchema} />
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
