import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "利用規約",
  description:
    "SurQの利用規約です。大学生向けアンケート回答交換サービスの利用条件、禁止事項、免責事項を確認できます。",
  path: "/terms",
  keywords: ["SurQ 利用規約", "アンケートサービス 規約", "Webアプリ 利用条件"],
})

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children
}
