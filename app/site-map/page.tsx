'use client'

import Link from 'next/link'
import {
  BarChart3,
  BookOpenText,
  ClipboardList,
  FileText,
  Home,
  Lightbulb,
  LogIn,
  MessageSquare,
  PlusCircle,
  Shield,
  TrendingUp,
  User,
  UserPlus,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sitemapData = [
  {
    category: "メインページ",
    pages: [
      {
        name: "ホーム",
        path: "/",
        description: "SurQの概要と主要導線をまとめたトップページです。",
        icon: Home,
      },
      {
        name: "アプリ",
        path: "/app",
        description: "メインのアプリ画面です。",
        icon: ClipboardList,
      },
      {
        name: "ダッシュボード",
        path: "/dashboard",
        description: "利用状況を確認できるダッシュボードです。",
        icon: BarChart3,
      },
    ],
  },
  {
    category: "認証",
    pages: [
      {
        name: "ログイン",
        path: "/login",
        description: "既存ユーザー向けのログインページです。",
        icon: LogIn,
      },
      {
        name: "新規登録",
        path: "/signup",
        description: "新しくアカウントを作成するページです。",
        icon: UserPlus,
      },
    ],
  },
  {
    category: "アンケート関連",
    pages: [
      {
        name: "アンケート作成",
        path: "/survey/create",
        description: "新しいアンケートを投稿するページです。",
        icon: PlusCircle,
      },
      {
        name: "アンケート詳細",
        path: "/survey/[id]",
        description: "個別アンケートの閲覧と回答ページです。",
        icon: MessageSquare,
      },
      {
        name: "回答結果",
        path: "/survey/results/[id]",
        description: "アンケート結果を確認するページです。",
        icon: TrendingUp,
      },
      {
        name: "回答一覧",
        path: "/survey/[id]/responses",
        description: "回答内容を確認するページです。",
        icon: FileText,
      },
      {
        name: "公開中のアンケート一覧",
        path: "/surveys",
        description: "回答できるアンケートを一覧で確認できます。",
        icon: ClipboardList,
      },
    ],
  },
  {
    category: "ブログ",
    pages: [
      {
        name: "ブログ一覧",
        path: "/blog",
        description: "卒業論文のアンケート調査や、個人開発の需要検証に役立つ記事一覧です。",
        icon: BookOpenText,
      },
      {
        name: "卒論アンケート記事",
        path: "/blog/graduation-thesis-and-survey",
        description: "卒業論文でアンケート調査を進めるときの考え方を整理した記事です。",
        icon: FileText,
      },
      {
        name: "個人開発の需要検証記事",
        path: "/blog/indie-dev-demand-validation",
        description: "ターゲットと需要を見極める重要性をまとめた記事です。",
        icon: Lightbulb,
      },
    ],
  },
  {
    category: "ユーザー",
    pages: [
      {
        name: "プロフィール",
        path: "/profile",
        description: "ユーザープロフィールや設定を確認できます。",
        icon: User,
      },
    ],
  },
  {
    category: "ポリシー",
    pages: [
      {
        name: "プライバシーポリシー",
        path: "/privacy",
        description: "個人情報の取り扱いに関する方針です。",
        icon: Shield,
      },
      {
        name: "利用規約",
        path: "/terms",
        description: "サービスの利用条件をまとめています。",
        icon: FileText,
      },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            SurQ サイトマップ
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            SurQ内の主要ページを一覧で確認できます。ブログも含めて、目的に合う入口を選びやすくしました。
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            検索エンジン向けのXMLサイトマップは{" "}
            <a href="/sitemap.xml" className="text-primary hover:underline">
              /sitemap.xml
            </a>{" "}
            です。
          </p>
        </div>

        <div className="grid gap-8">
          {sitemapData.map((category) => (
            <Card key={category.category} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <CardTitle className="text-xl font-semibold text-foreground">
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {category.pages.map((page) => {
                    const IconComponent = page.icon

                    return (
                      <div
                        key={page.path}
                        className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="mb-2 flex items-center space-x-3">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <h3 className="font-medium text-foreground">{page.name}</h3>
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">
                          {page.description}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {page.path}
                          </code>
                          {!page.path.includes("[id]") && (
                            <Button asChild size="sm" variant="outline" className="text-xs">
                              <Link href={page.path}>アクセス</Link>
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

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="mb-4">
            <Link href="/">ホームに戻る</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            最終更新: 2026年5月7日
          </p>
        </div>
      </div>
    </div>
  )
}
