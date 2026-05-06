import { blogPosts } from "@/lib/blog"
import { absoluteUrl } from "@/lib/seo"

export const dynamic = "force-static"

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const items = blogPosts
    .map(
      (post) => `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${absoluteUrl(`/blog/${post.slug}`)}</link>
          <guid>${absoluteUrl(`/blog/${post.slug}`)}</guid>
          <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
          <description>${escapeXml(post.description)}</description>
        </item>`
    )
    .join("")

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>SurQ Blog</title>
        <link>${absoluteUrl("/blog")}</link>
        <description>卒業論文のアンケート調査や、個人開発の需要検証に役立つSurQのブログ。</description>
        <language>ja-JP</language>
        ${items}
      </channel>
    </rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  })
}
