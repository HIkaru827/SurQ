import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "公開中のアンケート一覧",
  description:
    "SurQで公開中の大学生向けアンケート一覧です。卒論・ゼミ・レポート・個人開発向けのアンケートに回答して、投稿権を獲得できます。",
  path: "/surveys",
  keywords: [
    "アンケート 一覧",
    "大学生 アンケート 回答",
    "卒論 アンケート 回答募集",
    "Googleフォーム アンケート 回答",
  ],
})

export default function SurveysLayout({ children }: { children: ReactNode }) {
  return children
}
