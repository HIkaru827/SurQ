import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "アンケート結果",
  description: "SurQのアンケート結果ページです。",
  path: "/survey/results",
  noindex: true,
})

export default function SurveyResultsLayout({ children }: { children: ReactNode }) {
  return children
}
