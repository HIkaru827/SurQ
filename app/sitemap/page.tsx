'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Home,
  UserPlus,
  LogIn,
  PlusCircle,
  BarChart3,
  User,
  FileText,
  Shield,
  ClipboardList,
  TrendingUp,
  MessageSquare
} from 'lucide-react'

export default function SitemapPage() {
  const sitemapData = [
    {
      category: "メインページ",
      pages: [
        {
          name: "ホーム",
          path: "/",
          description: "SurQアンケートプラットフォームのトップページ",
          icon: Home
        },
        {
          name: "アプリ",
          path: "/app",
          description: "メインアプリケーション画面",
          icon: ClipboardList
        },
        {
          name: "ダッシュボード",
          path: "/dashboard",
          description: "ユーザー専用ダッシュボード",
          icon: BarChart3
        }
      ]
    },
    {
      category: "認証",
      pages: [
        {
          name: "ログイン",
          path: "/login",
          description: "ユーザーログインページ",
          icon: LogIn
        },
        {
          name: "新規登録",
          path: "/signup",
          description: "新規ユーザー登録ページ",
          icon: UserPlus
        }
      ]
    },
    {
      category: "アンケート機能",
      pages: [
        {
          name: "アンケート作成",
          path: "/survey/create",
          description: "新しいアンケートを作成",
          icon: PlusCircle
        },
        {
          name: "アンケート詳細",
          path: "/survey/[id]",
          description: "個別のアンケート表示・回答ページ",
          icon: MessageSquare
        },
        {
          name: "回答結果",
          path: "/survey/results/[id]",
          description: "アンケートの回答結果表示",
          icon: TrendingUp
        },
        {
          name: "回答管理",
          path: "/survey/[id]/responses",
          description: "作成者向け回答詳細管理",
          icon: FileText
        }
      ]
    },
    {
      category: "ユーザー",
      pages: [
        {
          name: "プロフィール",
          path: "/profile",
          description: "ユーザープロフィール・設定管理",
          icon: User
        }
      ]
    },
    {
      category: "規約・ポリシー",
      pages: [
        {
          name: "プライバシーポリシー",
          path: "/privacy",
          description: "個人情報保護方針",
          icon: Shield
        },
        {
          name: "利用規約",
          path: "/terms",
          description: "サービス利用規約",
          icon: FileText
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            SurQ サイトマップ
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            SurQアンケートプラットフォームの全ページとその機能をご覧いただけます
          </p>
        </div>

        <div className="grid gap-8">
          {sitemapData.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <CardTitle className="text-xl font-semibold text-foreground">
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {category.pages.map((page, pageIndex) => {
                    const IconComponent = page.icon
                    return (
                      <div
                        key={pageIndex}
                        className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <IconComponent className="w-5 h-5 text-primary" />
                          <h3 className="font-medium text-foreground">
                            {page.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {page.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                            {page.path}
                          </code>
                          {!page.path.includes('[id]') && (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <Link href={page.path}>
                                アクセス
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="mb-4">
            <Link href="/">
              ホームに戻る
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            最終更新: 2025年8月31日
          </p>
        </div>
      </div>
    </div>
  )
}