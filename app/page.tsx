import LandingPage from "@/app/_components/LandingPage"
import { createMetadata } from "@/lib/seo"

export const metadata = createMetadata({
  title: "大学生向けアンケート回答交換サービス",
  description:
    "SurQは、卒論・ゼミ・レポート・個人開発のアンケートを集めたい大学生向けの無料Webアプリです。回答交換の仕組みで、Googleフォームの回答も集めやすくなります。",
  path: "/",
  keywords: [
    "大学生 アンケート 集める",
    "卒論 アンケート 集まらない",
    "アンケート 回答交換",
    "Googleフォーム 回答 集める",
    "無料 アンケート 回答募集",
  ],
})

export default function HomePage() {
  return <LandingPage />
}
