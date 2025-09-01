'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cookie, Shield, X } from 'lucide-react'

export function PrivacyNotice() {
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    const hasAccepted = localStorage.getItem('analytics_consent')
    if (!hasAccepted && process.env.NODE_ENV === 'production') {
      setShowNotice(true)
    }
  }, [])

  const acceptAnalytics = () => {
    localStorage.setItem('analytics_consent', 'true')
    setShowNotice(false)
  }

  const declineAnalytics = () => {
    localStorage.setItem('analytics_consent', 'false')
    setShowNotice(false)
    // GA4を無効化
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      })
    }
  }

  if (!showNotice) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">プライバシーについて</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={declineAnalytics}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm mb-4">
            サービス改善のため、匿名の使用統計を収集させていただいています。
            個人を特定する情報は収集されません。
          </CardDescription>
          
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-green-600" />
            <Badge variant="secondary" className="text-xs">
              匿名・安全
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={acceptAnalytics}
              size="sm"
              className="flex-1"
            >
              同意する
            </Button>
            <Button
              onClick={declineAnalytics}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              拒否
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}