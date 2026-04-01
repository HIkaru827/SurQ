import type { Metadata } from "next"
import type { ReactNode } from "react"
import { absoluteUrl, createMetadata, SITE_URL } from "@/lib/seo"

type SurveySeoPayload = {
  survey?: {
    id: string
    title?: string
    description?: string | null
    category?: string
    estimated_time?: number
    target_audience?: string
    is_published?: boolean
  }
}

async function fetchSurvey(id: string) {
  try {
    const response = await fetch(`${SITE_URL}/api/surveys/${id}`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as SurveySeoPayload
    return data.survey ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const survey = await fetchSurvey(id)

  if (!survey) {
    return createMetadata({
      title: "アンケート詳細",
      description: "SurQで公開されているアンケート詳細ページです。",
      path: `/survey/${id}`,
    })
  }

  const description =
    survey.description ||
    `SurQで公開中のアンケート「${survey.title}」の回答ページです。大学生向けアンケートに協力して、投稿権を獲得できます。`

  const keywords = [
    "アンケート 回答",
    "大学生 アンケート",
    survey.category,
    survey.target_audience,
    survey.title,
  ].filter(Boolean) as string[]

  const metadata = createMetadata({
    title: survey.title || "アンケート詳細",
    description,
    path: `/survey/${id}`,
    keywords,
    type: "article",
    noindex: survey.is_published === false,
  })

  return {
    ...metadata,
    alternates: {
      canonical: absoluteUrl(`/survey/${id}`),
    },
  }
}

export default function SurveyDetailLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}
