"use client"

import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Target,
  Users,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
      name: "SurQとはどんなサービスですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SurQは、大学生が他のアンケートに回答することで、自分のアンケートも投稿しやすくなる相互扶助型のWebアプリです。",
      },
    },
    {
      "@type": "Question",
      name: "どんな人に向いていますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "卒業論文、ゼミ、レポート、個人開発などでアンケート回答を集めたい大学生に向いています。",
      },
    },
    {
      "@type": "Question",
      name: "Googleフォームも使えますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい。SurQではGoogleフォームのURLを使ってアンケートを投稿できます。",
      },
    },
  ],
}

const painPoints = [
  "アンケートを作っても回答が集まらない",
  "Googleフォームのリンクを貼るだけでは広がりにくい",
  "SNSで募集しても回答者が偏りやすい",
  "締切が近づくほど焦りが大きくなる",
]

const steps = [
  {
    step: "1",
    title: "まずは他のアンケートに回答",
    text: "SurQ内の公開アンケートに答えることで、投稿に使えるポイントを貯められます。",
  },
  {
    step: "2",
    title: "4回答で1件投稿",
    text: "4件回答すると、自分のアンケートを1件投稿できます。",
  },
  {
    step: "3",
    title: "自分の回答も集めやすくなる",
    text: "参加者が回答し合う仕組みなので、単独で募集するより接点を持ちやすくなります。",
  },
]

const strengths = [
  {
    icon: Users,
    title: "大学生どうしの回答導線をつくれる",
    text: "ゼミやレポート、卒業論文など、大学生が必要とする回答集めに向いた仕組みです。",
  },
  {
    icon: Zap,
    title: "回答交換の設計で動きやすい",
    text: "一方通行の募集ではなく、回答する人にも参加理由があるため、調査を進めやすくなります。",
  },
  {
    icon: Target,
    title: "Googleフォームとも併用しやすい",
    text: "使い慣れたフォームをそのまま活かしながら、回答導線だけSurQで補えます。",
  },
]

const blogHighlights = [
  {
    icon: GraduationCap,
    title: "卒業論文でアンケート調査を行うときに知っておきたいこと",
    description:
      "設問設計、回答回収、分析しやすいデータ作りまで、卒論アンケートで詰まりやすいポイントを整理。",
    href: "/blog/graduation-thesis-and-survey",
    label: "卒業論文",
  },
  {
    icon: Lightbulb,
    title: "個人開発でターゲットと需要を見極めることがなぜ大切なのか",
    description:
      "作ってから悩む前に、誰のどんな課題を解くのかをどう確かめるか。需要検証の考え方を紹介。",
    href: "/blog/indie-dev-demand-validation",
    label: "個人開発",
  },
]

const comparisons = {
  good: [
    "大学生向けの回答導線がある",
    "回答し合う設計で参加理由を作りやすい",
    "Googleフォームの回答取得にも使いやすい",
    "無料で検証を始めやすい",
  ],
  hard: [
    "回答者との接点がないまま募集するケース",
    "属性が偏ったまま大事な調査を進めること",
    "短期間で十分な件数を集めること",
    "情報発信だけで継続的に回答を集めること",
  ],
}

const faqs = [
  {
    q: "アンケートの回答が集まらないときにも使えますか？",
    a: "使えます。SurQは回答し合う仕組みを前提にしているため、回答者との接点を作りやすいサービスです。",
  },
  {
    q: "Googleフォームのまま投稿できますか？",
    a: "はい。GoogleフォームのURLを登録して利用できます。既存のフォームを作り直す必要はありません。",
  },
  {
    q: "利用は無料ですか？",
    a: "SurQは無料で使い始められます。まずは回答してポイントを貯め、自分のアンケート投稿につなげられます。",
  },
]

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
                回答が集まらない大学生へ。
              </h2>
              <p className="mb-6 text-3xl font-bold leading-tight text-primary md:text-4xl">
                「答える」だけで、
                <br className="sm:hidden" />
                あなたの回答も集まりやすくなる。
              </p>
              <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                SurQは、卒業論文・ゼミ・レポート・個人開発のためにアンケート回答を集めたい大学生向けのWebアプリです。
                先に他のアンケートへ回答することで、調査に必要な接点を持ちやすくなります。Googleフォームとも併用できます。
              </p>

              <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/login">
                  <Button size="lg" className="rounded-full px-10 py-6 text-lg shadow-lg">
                    まずは始める
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/surveys">
                  <Button size="lg" variant="outline" className="rounded-full px-10 py-6 text-lg">
                    公開中のアンケートを見る
                  </Button>
                </Link>
                <Link href="/blog">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="rounded-full border border-primary/15 bg-white/70 px-8 py-6 text-lg text-primary shadow-sm hover:bg-primary/5"
                  >
                    <BookOpenText className="h-5 w-5" />
                    ブログを読む
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <span className="rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">無料で使える</span>
                <span className="rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">Googleフォーム対応</span>
                <span className="rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">大学生向け</span>
                <span className="rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">ブログ公開中</span>
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
                よくあるつまずきに対して、SurQは回答導線という形で向き合います。
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {painPoints.map((item) => (
                <Card key={item} className="border-2 border-muted bg-background">
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-orange-500" />
                      <div>
                        <CardTitle className="mb-2 text-lg">{item}</CardTitle>
                        <CardDescription className="text-base">
                          一度は感じやすい課題だからこそ、回答者との接点を持てる仕組みが重要です。
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
                回答する人だけでなく、回答を集めたい人にもメリットがあるシンプルな流れです。
              </p>
            </div>

            <div className="mb-12 grid gap-8 md:grid-cols-3">
              {steps.map((item) => (
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
              {strengths.map(({ icon: Icon, title, text }) => (
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

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div>
                <Badge className="mb-4 rounded-full px-3 py-1 text-sm">SURQ BLOG</Badge>
                <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                  読み物として、実際の調査を整える
                </h2>
                <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  卒業論文のアンケート調査や、個人開発の需要検証に役立つ記事をまとめました。
                  SurQを使う前に考えておきたいことを、短く整理して読めます。
                </p>
              </div>

              <Link href="/blog">
                <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-base">
                  すべての記事を見る
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {blogHighlights.map(({ icon: Icon, title, description, href, label }) => (
                <Card
                  key={href}
                  className="border-0 bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.42)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <CardHeader>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-primary/10 px-3 py-1 text-primary"
                      >
                        {label}
                      </Badge>
                    </div>
                    <CardTitle className="mb-3 text-2xl leading-tight">{title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {description}
                    </CardDescription>
                    <div className="pt-4">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        記事を読む
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
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
                SurQが向いている人
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-2 border-green-200 bg-green-50/50">
                <CardHeader>
                  <div className="mb-6 flex items-center space-x-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <CardTitle className="text-2xl text-green-900">相性がいい人</CardTitle>
                  </div>
                  <div className="space-y-4 text-green-800">
                    {comparisons.good.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2 border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <div className="mb-6 flex items-center space-x-3">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                    <CardTitle className="text-2xl text-orange-900">難しさが残るケース</CardTitle>
                  </div>
                  <div className="space-y-4 text-orange-800">
                    {comparisons.hard.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
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
              {faqs.map((item) => (
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
              回答することで、あなたのアンケートにも次の接点が生まれます。
              卒論、レポート、個人開発の調査を無料で始めましょう。
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
