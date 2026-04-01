"use client"

import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Target,
  Users,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  StructuredData,
  organizationSchema,
  webApplicationSchema,
} from "@/components/seo/StructuredData"
import { createBreadcrumbSchema } from "@/lib/seo"

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "SurQとは何ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SurQは、大学生同士でアンケートに回答し合いながら、自分のアンケートも集めやすくする無料Webアプリです。",
      },
    },
    {
      "@type": "Question",
      name: "どんな人に向いていますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "卒論、ゼミ、レポート、個人開発などでアンケート回答を集めたい大学生に向いています。",
      },
    },
    {
      "@type": "Question",
      name: "Googleフォームは使えますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい。SurQではGoogleフォームのURLを使ってアンケートを投稿できます。",
      },
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={webApplicationSchema} />
      <StructuredData data={faqSchema} />
      <StructuredData
        data={createBreadcrumbSchema([{ name: "ホーム", path: "/" }])}
      />

      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/10" />
          <div className="relative container mx-auto px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl text-center">
              <div className="mb-6 flex items-center justify-center space-x-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">S</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground">SurQ</h1>
              </div>

              <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-primary">
                大学生向けアンケート回答交換サービス
              </p>
              <h2 className="mb-4 text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                卒論アンケートが集まらない大学生へ。
              </h2>
              <p className="mb-6 text-3xl font-bold leading-tight text-primary md:text-4xl">
                「答える」だけで、
                <br className="sm:hidden" />
                あなたの回答も集まりやすくなる。
              </p>
              <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                SurQは、卒論・ゼミ・レポート・個人開発のためにアンケートを集めたい大学生が、
                互いに回答し合うことで調査を前に進められる無料Webアプリです。Googleフォームにも対応しています。
              </p>

              <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/login">
                  <Button size="lg" className="rounded-full px-10 py-6 text-lg shadow-lg">
                    今すぐ始める
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/surveys">
                  <Button size="lg" variant="outline" className="rounded-full px-10 py-6 text-lg">
                    公開中のアンケートを見る
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <span className="rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">完全無料</span>
                <span className="rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">Googleフォーム対応</span>
                <span className="rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">大学生向け</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                こんな悩みを持つ人に使われるサービスです
              </h2>
              <p className="text-lg text-muted-foreground">
                検索されやすい悩みそのものに、SurQは正面から対応します。
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                "卒論アンケートが集まらない",
                "Googleフォームの回答が増えない",
                "SNSで募集しても反応が薄い",
                "友達に何度も依頼しづらい",
              ].map((item) => (
                <Card key={item} className="border-2 border-muted bg-background">
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-orange-500" />
                      <div>
                        <CardTitle className="mb-2 text-lg">{item}</CardTitle>
                        <CardDescription className="text-base">
                          一時的な拡散ではなく、回答した人が次の回答者になる循環で集めやすくします。
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                SurQの仕組み
              </h2>
              <p className="text-xl text-muted-foreground">
                回答する人だけが、回答を集められるシンプルな仕組みです。
              </p>
            </div>

            <div className="mb-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "他のアンケートに回答",
                  text: "まずは大学生向けアンケートに回答して、調査に協力します。",
                },
                {
                  step: "2",
                  title: "4件回答で投稿権を獲得",
                  text: "4件回答すると、自分のアンケートを1件投稿できます。",
                },
                {
                  step: "3",
                  title: "自分の回答も集まりやすくなる",
                  text: "投稿されたアンケートが次の回答対象になり、循環が生まれます。",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg">
                    <span className="text-3xl font-bold text-primary-foreground">{item.step}</span>
                  </div>
                  <h3 className="mb-4 text-2xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-lg leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: "同じ課題感の大学生が集まる",
                  text: "卒論やレポートでアンケートを必要としている人が多いため、関心の高い回答者が集まりやすくなります。",
                },
                {
                  icon: Zap,
                  title: "回答交換の設計で流動性を作る",
                  text: "回答しないと投稿できないため、募集だけが増えて回答者がいない状態を防ぎやすい設計です。",
                },
                {
                  icon: Target,
                  title: "Googleフォームで始めやすい",
                  text: "新しい調査環境を覚えず、使い慣れたGoogleフォームをそのまま使えます。",
                },
              ].map(({ icon: Icon, title, text }) => (
                <Card key={title} className="border-0 bg-background shadow-lg">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mb-3 text-xl">{title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{text}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                SurQが向いている使い方
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-2 border-green-200 bg-green-50/50">
                <CardHeader>
                  <div className="mb-6 flex items-center space-x-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <CardTitle className="text-2xl text-green-900">向いている人</CardTitle>
                  </div>
                  <div className="space-y-4 text-green-800">
                    <p>卒論・ゼミ・レポートのアンケートを集めたい大学生</p>
                    <p>数分で答えられるアンケートを配布したい人</p>
                    <p>Googleフォームの回答数を増やしたい人</p>
                    <p>無料で調査協力を集めたい人</p>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2 border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <div className="mb-6 flex items-center space-x-3">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                    <CardTitle className="text-2xl text-orange-900">向いていないケース</CardTitle>
                  </div>
                  <div className="space-y-4 text-orange-800">
                    <p>回答せずに募集だけしたいケース</p>
                    <p>企業向けの大規模市場調査</p>
                    <p>30分以上かかる長いアンケート</p>
                    <p>非常に限定的な属性だけを厳密に狙う調査</p>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                よくある質問
              </h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  q: "卒論アンケートの回答が集まらないときにも使えますか？",
                  a: "使えます。SurQは卒論・ゼミ・レポートのように、大学生が回答を集めたい場面を想定したサービスです。",
                },
                {
                  q: "Googleフォームのまま投稿できますか？",
                  a: "GoogleフォームのURLを登録して投稿できます。新しく別のフォームを作り直す必要はありません。",
                },
                {
                  q: "利用料金はかかりますか？",
                  a: "SurQは完全無料で使えます。まずは他のアンケートに回答し、投稿権を獲得してから自分のアンケートを掲載します。",
                },
              ].map((item) => (
                <Card key={item.q} className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.q}</CardTitle>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                      {item.a}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              大学生向けアンケートを、もっと集めやすく。
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-primary-foreground/90">
              回答することで、あなたのアンケートも前に進みます。卒論、レポート、個人開発の調査を無料で始めましょう。
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full rounded-full px-10 py-6 text-lg shadow-lg sm:w-auto"
                >
                  ログインして始める
                </Button>
              </Link>
              <Link href="/surveys">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full border-2 border-white bg-white text-lg text-primary hover:bg-white/90 sm:w-auto"
                >
                  公開中のアンケートを見る
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
