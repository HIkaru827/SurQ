import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "プライバシーポリシー",
  description:
    "SurQのプライバシーポリシーです。大学生向けアンケート回答交換サービスにおける個人情報の取得、利用目的、管理方法を確認できます。",
  path: "/privacy",
  keywords: ["SurQ プライバシーポリシー", "個人情報保護", "アンケートサービス プライバシー"],
})

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children
}
