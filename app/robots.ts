import { MetadataRoute } from "next";
import { EnvConfig } from "@/lib/seo/infrastructure/env.config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = EnvConfig.getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/admin/", "/api/"],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended"],
        allow: ["/", "/blog/", "/alternatives/", "/tools/"],
        disallow: ["/dashboard/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

