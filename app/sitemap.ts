import { MetadataRoute } from "next"
import { blogPosts } from "@/lib/blog"
import { SITE_URL } from "@/lib/seo"

type SurveySitemapItem = {
  id: string
  updated_at?: string
  is_published?: boolean
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/surveys`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/site-map`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...blogPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ]

  try {
    const response = await fetch(`${SITE_URL}/api/surveys`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return staticPages
    }

    const data = (await response.json()) as { surveys?: SurveySitemapItem[] }
    const surveyPages: MetadataRoute.Sitemap = (data.surveys || [])
      .filter((survey) => survey.id && survey.is_published !== false)
      .map((survey) => ({
        url: `${SITE_URL}/survey/${survey.id}`,
        lastModified: survey.updated_at ? new Date(survey.updated_at) : now,
        changeFrequency: "daily",
        priority: 0.7,
      }))

    return [...staticPages, ...surveyPages]
  } catch {
    return staticPages
  }
}
