import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "お問い合わせ",
  description:
    "SurQに関するお問い合わせページです。サービスの使い方、要望、バグ報告、大学生向けアンケート収集のご相談を受け付けています。",
  path: "/contact",
  keywords: ["SurQ 問い合わせ", "アンケート サービス 問い合わせ", "大学生 アンケート 相談"],
})

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
