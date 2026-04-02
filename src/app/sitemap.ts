import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

const publicRoutes = ["", "/about", "/sources", "/contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified,
  }));
}
