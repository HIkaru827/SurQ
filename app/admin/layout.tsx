import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "管理者ページ",
  description: "SurQの管理者向けページです。",
  path: "/admin",
  noindex: true,
})

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children
}
