import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/surveys", "/survey/", "/privacy", "/terms", "/contact", "/site-map"],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard",
          "/login",
          "/profile",
          "/signup",
          "/survey/create",
          "/survey/*/responses",
          "/survey/results/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
