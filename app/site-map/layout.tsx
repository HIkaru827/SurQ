import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'サイトマップ',
  description: 'SurQアンケートプラットフォームの全ページと機能の一覧。サイト構造を確認できます。',
  keywords: ['サイトマップ', 'sitemap', 'ページ一覧', 'サイト構造', 'SurQ'],
  openGraph: {
    title: 'サイトマップ - SurQ',
    description: 'SurQアンケートプラットフォームの全ページと機能の一覧',
    type: 'website',
    siteName: 'SurQ',
  },
  twitter: {
    card: 'summary',
    title: 'サイトマップ - SurQ',
    description: 'SurQアンケートプラットフォームの全ページと機能の一覧',
  },
  alternates: {
    canonical: 'https://surq.net/site-map',
  },
}

export default function SiteMapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


