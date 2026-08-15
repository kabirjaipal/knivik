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
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "cohere-ai",
          "CCBot",
          "Bytespider",
          "Diffbot",
        ],
        allow: ["/", "/blog/", "/alternatives/", "/tools/", "/pricing"],
        disallow: ["/dashboard/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

