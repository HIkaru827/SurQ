import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "アンケート一覧",
  description: "SurQのログイン後ページです。公開検索向けには /surveys を参照してください。",
  path: "/app",
  noindex: true,
})

export default function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}
