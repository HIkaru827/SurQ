'use client'

import Script from 'next/script'

const ADSENSE_CLIENT_ID = 'ca-pub-2931164651880564'

export function GoogleAdSense() {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  )
}
