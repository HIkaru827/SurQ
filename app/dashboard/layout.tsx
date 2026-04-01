import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "ダッシュボード",
  description: "SurQのダッシュボードです。",
  path: "/dashboard",
  noindex: true,
})

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children
}
