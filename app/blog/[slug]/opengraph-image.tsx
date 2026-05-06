import { ImageResponse } from "next/og"
import { getBlogPost } from "@/lib/blog"

export const runtime = "edge"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPost(slug)

  const title = post?.title ?? "SurQ Blog"
  const category = post?.category ?? "ブログ"

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "radial-gradient(circle at top left, rgba(16,185,129,0.24), transparent 36%), linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(236,253,245,1) 100%)",
          color: "#052e2b",
          padding: "56px",
          fontFamily: "sans-serif",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              borderRadius: "999px",
              background: "#d1fae5",
              color: "#047857",
              padding: "10px 18px",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            {category}
          </div>
          <div style={{ fontSize: "24px", color: "#059669", letterSpacing: "0.2em" }}>
            SURQ BLOG
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "26px",
            maxWidth: "1000px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              lineHeight: 1.18,
              fontWeight: 800,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "28px", color: "#065f46" }}>
            SurQの記事ページ
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#065f46",
          }}
        >
          <div style={{ fontSize: "28px" }}>アンケート調査と需要検証の実践知</div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>surq.net</div>
        </div>
      </div>
    ),
    size
  )
}
