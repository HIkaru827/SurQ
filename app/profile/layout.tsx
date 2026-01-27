import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'マイページ',
  description: 'SurQのマイページ。あなたのアンケート、回答履歴、統計情報を管理できます。',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: 'マイページ - SurQ',
    description: 'SurQのマイページ。あなたのアンケート、回答履歴、統計情報を管理できます。',
    type: 'website',
    siteName: 'SurQ',
  },
  twitter: {
    card: 'summary',
    title: 'マイページ - SurQ',
    description: 'SurQのマイページ。あなたのアンケート、回答履歴、統計情報を管理できます。',
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

