import type { ReactNode } from "react"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "ログイン",
  description: "SurQのログインページです。",
  path: "/login",
  noindex: true,
})

export default function LoginLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}


