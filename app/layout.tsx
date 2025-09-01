import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AuthProvider } from '@/lib/auth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SurQ - 知見を循環させるアンケートプラットフォーム',
    template: '%s | SurQ'
  },
  description: '答えてポイント獲得、作って知見共有。SurQは質問者と回答者が価値を交換する革新的なアンケートプラットフォームです。無料登録で今すぐ始めよう。',
  keywords: ['アンケート', 'survey', '調査', 'questionnaire', 'ポイント', 'フィードバック', 'マーケティング', 'リサーチ', '循環型', '知見共有', 'SurQ'],
  authors: [{ name: 'SurQ Team' }],
  creator: 'SurQ',
  publisher: 'SurQ',
  generator: 'Next.js',
  manifest: '/manifest.json',
  metadataBase: new URL('https://surq.net'),
  alternates: {
    canonical: 'https://surq.net',
    languages: {
      'ja-JP': 'https://surq.net',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://surq.net',
    title: 'SurQ - 知見を循環させるアンケートプラットフォーム',
    description: '答えてポイント獲得、作って知見共有。革新的な循環型アンケートシステム',
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
    title: 'SurQ - 知見を循環させるアンケートプラットフォーム',
    description: '答えてポイント獲得、作って知見共有。革新的な循環型アンケートシステム',
    images: ['https://surq.net/surq_logo.png'],
    creator: '@SurQ_platform',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SurQ',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'SurQ',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-tap-highlight': 'no',
  },
}

export function generateViewport() {
  return {
    themeColor: '#3b82f6',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
