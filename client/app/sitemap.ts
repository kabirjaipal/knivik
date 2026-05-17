import { MetadataRoute } from "next";
import { EnvConfig } from "@/lib/seo/infrastructure/env.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/pricing",
    "/contact",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/login",
    "/register",
  ].map((route) => ({
    url: EnvConfig.resolveUrl(route),
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  return routes;
}

