import Head from 'next/head'
import { FC } from 'react'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  canonicalUrl?: string
  noindex?: boolean
}

export const SEOHead: FC<SEOHeadProps> = ({
  title = 'SurQ - 知見を循環させるアンケートプラットフォーム',
  description = '答えてポイント獲得、作って知見共有。SurQは質問者と回答者が価値を交換する革新的なアンケートプラットフォームです。',
  keywords = ['アンケート', 'survey', '調査', 'questionnaire', 'ポイント', 'フィードバック', 'マーケティング', 'リサーチ', '循環型', '知見共有'],
  ogImage = 'https://surq.net/surq_logo.png',
  canonicalUrl,
  noindex = false,
}) => {
  const fullTitle = title.includes('SurQ') ? title : `${title} | SurQ`
  
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="SurQ" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Robots */}
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      
      {/* Additional SEO */}
      <meta name="author" content="SurQ Team" />
      <meta name="language" content="ja" />
      <meta name="revisit-after" content="7 days" />
    </Head>
  )
}