import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ログイン',
  description: 'SurQアカウントにログインして、アンケートの作成・回答を始めましょう。既存アカウントでの安全なログイン。',
  keywords: ['ログイン', 'login', 'サインイン', 'sign in', 'SurQ', 'アカウント'],
  openGraph: {
    title: 'ログイン - SurQ',
    description: 'SurQアカウントにログインして、アンケートの作成・回答を始めましょう。',
    type: 'website',
    siteName: 'SurQ',
    url: 'https://surq.net/login',
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
    card: 'summary',
    title: 'ログイン - SurQ',
    description: 'SurQアカウントにログインして、アンケートの作成・回答を始めましょう。',
    images: ['https://surq.net/surq_logo.png'],
  },
  alternates: {
    canonical: 'https://surq.net/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


