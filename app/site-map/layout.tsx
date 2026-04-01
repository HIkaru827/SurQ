import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "サイトマップ",
  description: "SurQの主要ページ一覧です。大学生向けアンケート回答交換サービスの公開ページ構成を確認できます。",
  path: "/site-map",
  keywords: ["SurQ サイトマップ", "ページ一覧", "大学生向けアンケートサービス"],
})

export default function SiteMapLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}


