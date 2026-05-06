import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "ブログ",
  description:
    "SurQのブログ一覧です。卒業論文のアンケート調査や、個人開発の需要検証に役立つ記事を掲載しています。",
  path: "/blog",
  keywords: [
    "SurQ ブログ",
    "卒業論文 アンケート",
    "個人開発 需要検証",
    "アンケート調査 記事",
  ],
})

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children
}
