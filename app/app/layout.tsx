import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'アンケート一覧',
  description: '様々なアンケートに回答してポイントを獲得しよう！SurQで公開中の最新アンケートをチェック。回答するだけで投稿権を獲得できます。',
  keywords: ['アンケート', '回答', 'ポイント', 'survey', '質問', 'フィードバック', 'SurQ'],
  openGraph: {
    title: 'アンケート一覧 - SurQ',
    description: '様々なアンケートに回答してポイントを獲得しよう！最新アンケートをチェック。',
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
    title: 'アンケート一覧 - SurQ',
    description: '様々なアンケートに回答してポイントを獲得しよう！最新アンケートをチェック。',
    images: ['https://surq.net/surq_logo.png'],
  },
  alternates: {
    canonical: 'https://surq.net/app',
  },
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
