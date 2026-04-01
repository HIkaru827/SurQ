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
  "description": "大学生向けの無料アンケート回答交換サービス",
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
  "description": "大学生同士でアンケートに回答し合い、卒論やレポート向けの回答を集めやすくする無料Webアプリ",
  "url": "https://surq.net",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  },
  "featureList": [
    "大学生向けアンケート回答交換",
    "Googleフォーム対応",
    "無料でアンケート募集",
    "アンケート回答数に応じた投稿権",
    "回答状況の確認"
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
        "text": "SurQは、大学生が互いにアンケートへ回答し合いながら、自分のアンケートも集めやすくする無料Webアプリです。"
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
      "name": "Googleフォームは使えますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい。SurQではGoogleフォームのURLを登録してアンケートを投稿できます。"
      }
    },
    {
      "@type": "Question",
      "name": "どんなアンケートに向いていますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "卒論、ゼミ、レポート、個人開発などで大学生向けアンケートを集めたいケースに向いています。"
      }
    }
  ]
}
