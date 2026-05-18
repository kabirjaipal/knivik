import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { BillingProvider } from "@/context/billing-context";
import { PROJECT_NAME, PROJECT_DESCRIPTION, PROJECT_URL } from "@/lib/constants";
import { siteConfig } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: `${PROJECT_NAME} | ${PROJECT_DESCRIPTION}`,
    template: `%s | ${PROJECT_NAME}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  metadataBase: new URL(PROJECT_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@knivik",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: `${siteConfig.url}/manifest.json`,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FeedbackWidget } from "@/components/feedback-widget";
import { PostHogProvider } from "@/components/posthog-provider";

import { SchemaService } from "@/lib/seo/application/schema.service";
import { SchemaScript } from "@/components/seo/schema-script";
import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const softwareSchema = SchemaService.generateSoftwareApplicationSchema();

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <SchemaScript schema={softwareSchema} />
      </head>
      <body className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased`} suppressHydrationWarning>
        <NextTopLoader showSpinner={false} color="var(--primary)" />
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
          >
            <AuthProvider>
              <BillingProvider>
                <TooltipProvider>
                  {children}
                  <FeedbackWidget />
                </TooltipProvider>
              </BillingProvider>
            </AuthProvider>
          </ThemeProvider>
          <Toaster position="top-right" richColors closeButton />
          {process.env.NODE_ENV === "production" && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
        </PostHogProvider>
      </body>
    </html>
  );
}

