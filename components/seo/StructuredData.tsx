import { FC } from 'react'

interface StructuredDataProps {
  data: Record<string, any>
}

export const StructuredData: FC<StructuredDataProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// 組織データ
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SurQ",
  "description": "知見を循環させるアンケートプラットフォーム",
  "url": "https://surq.net",
  "logo": "https://surq.net/surq_logo.png",
  "sameAs": [
    "https://twitter.com/SurQ_platform"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["Japanese"]
  }
}

// Webアプリケーションデータ
export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "SurQ",
  "description": "答えてポイント獲得、作って知見共有する循環型アンケートプラットフォーム",
  "url": "https://surq.net",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  },
  "featureList": [
    "アンケート作成",
    "アンケート回答",
    "ポイントシステム",
    "回答分析",
    "通知機能"
  ]
}

// FAQデータ
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "SurQとは何ですか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SurQは知見を循環させるアンケートプラットフォームです。アンケートに答えてポイントを獲得し、そのポイントで自分のアンケートを作成・配布できます。"
      }
    },
    {
      "@type": "Question",
      "name": "利用料金はかかりますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SurQは完全無料でご利用いただけます。アンケートの作成・回答・ポイント獲得すべて無料です。"
      }
    },
    {
      "@type": "Question", 
      "name": "ポイントはどのように使えますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "獲得したポイントは新しいアンケートの作成・配布に使用できます。より多くの人に回答してもらうためのプレミアム機能にも活用可能です。"
      }
    },
    {
      "@type": "Question",
      "name": "回答データの安全性は保証されていますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい、SurQではFirebaseを基盤とした強固なセキュリティシステムを採用し、すべてのデータを暗号化して安全に保管しています。"
      }
    }
  ]
}