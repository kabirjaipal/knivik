import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { getSession } from "@/lib/auth-client";
import { headers } from "next/headers";
import { ReferralTracker } from "@/components/ReferralTracker";

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

  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      <ReferralTracker />
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
