import { MetadataRoute } from "next";
import { PROJECT_URL } from "@/lib/constants";

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
    url: `${PROJECT_URL}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}
