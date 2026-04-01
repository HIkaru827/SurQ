import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "回答一覧",
  description: "SurQの回答管理ページです。",
  path: "/survey/responses",
  noindex: true,
})

export default function SurveyResponsesLayout({ children }: { children: ReactNode }) {
  return children
}
