import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "マイページ",
  description: "SurQのマイページです。",
  path: "/profile",
  noindex: true,
})

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children
}
