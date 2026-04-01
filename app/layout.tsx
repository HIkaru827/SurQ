import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/lib/auth"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics"
import { PrivacyNotice } from "@/components/analytics/PrivacyNotice"
import { SITE_URL } from "@/lib/seo"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "SurQ | 大学生向けアンケート回答交換サービス",
    template: "%s | SurQ",
  },
  description:
    "SurQは、大学生同士でアンケートに回答し合える無料Webアプリです。卒論・ゼミ・レポート・個人開発のアンケート収集を、回答交換の仕組みで進められます。",
  keywords: [
    "大学生 アンケート 集める",
    "卒論 アンケート 集まらない",
    "アンケート 回答 募集",
    "Googleフォーム 回答 集める",
    "アンケート 回答交換",
    "大学生 アンケート",
    "SurQ",
  ],
  authors: [{ name: "SurQ Team" }],
  creator: "SurQ",
  publisher: "SurQ",
  generator: "Next.js",
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ja-JP": SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    title: "SurQ | 大学生向けアンケート回答交換サービス",
    description:
      "大学生向けのアンケート回答交換サービス。卒論・ゼミ・レポート・個人開発の調査を、無料で効率よく集められます。",
    siteName: "SurQ",
    images: [
      {
        url: `${SITE_URL}/surq_logo.png`,
        width: 1200,
        height: 630,
        alt: "SurQ - 大学生向けアンケート回答交換サービス",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SurQ | 大学生向けアンケート回答交換サービス",
    description:
      "大学生同士で回答し合い、卒論やレポートのアンケートを集めやすくする無料Webアプリ。",
    images: [
      {
        url: `${SITE_URL}/surq_logo.png`,
        alt: "SurQ - 大学生向けアンケート回答交換サービス",
        width: 300,
        height: 300,
      },
    ],
    creator: "@SurQ_App",
    site: "@SurQ_App",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SurQ",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "SurQ",
    "msapplication-TileColor": "#3b82f6",
    "twitter:domain": "surq.net",
    "twitter:url": SITE_URL,
    "msapplication-tap-highlight": "no",
  },
}

export function generateViewport() {
  return {
    themeColor: "#3b82f6",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <GoogleAnalytics />
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <PrivacyNotice />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
