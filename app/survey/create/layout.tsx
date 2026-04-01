import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'アンケート作成',
  description: 'SurQでオリジナルのアンケートを作成しよう。簡単な操作で質問を追加し、回答を収集できます。回答を集めて貴重なフィードバックを獲得。',
  keywords: ['アンケート作成', 'survey', '質問作成', 'questionnaire', 'フィードバック収集', 'SurQ'],
  openGraph: {
    title: 'アンケート作成 - SurQ',
    description: 'オリジナルのアンケートを作成して、貴重なフィードバックを収集しよう。',
    type: 'website',
    siteName: 'SurQ',
    images: [
      {
        url: 'https://surq.net/surq_logo.png',
        width: 1200,
        height: 630,
        alt: 'SurQ - アンケートプラットフォーム',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'アンケート作成 - SurQ',
    description: 'オリジナルのアンケートを作成して、貴重なフィードバックを収集しよう。',
    images: ['https://surq.net/surq_logo.png'],
  },
  alternates: {
    canonical: 'https://surq.net/survey/create',
  },
}

export default function SurveyCreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


