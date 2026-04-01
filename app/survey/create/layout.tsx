import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "アンケート作成",
  description: "SurQのアンケート作成ページです。",
  path: "/survey/create",
  noindex: true,
})

export default function SurveyCreateLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}


