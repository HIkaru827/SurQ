import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, rgba(236,253,245,1) 0%, rgba(255,255,255,1) 55%, rgba(209,250,229,1) 100%)",
          color: "#064e3b",
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
            gap: "18px",
          }}
        >
          <div
            style={{
              height: "72px",
              width: "72px",
              borderRadius: "24px",
              background: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "38px",
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "24px", letterSpacing: "0.24em", color: "#059669" }}>
              SURQ BLOG
            </div>
            <div style={{ fontSize: "54px", fontWeight: 700, marginTop: "12px" }}>
              調査と仮説検証の読みもの
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "#065f46",
          }}
        >
          <div style={{ fontSize: "28px", maxWidth: "800px", lineHeight: 1.35 }}>
            卒業論文のアンケート調査と、個人開発の需要検証に役立つ実践記事。
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>surq.net</div>
        </div>
      </div>
    ),
    size
  )
}
