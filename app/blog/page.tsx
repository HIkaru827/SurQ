import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpenText, Clock3, Sparkles } from "lucide-react"
import { blogPosts } from "@/lib/blog"
import { createBreadcrumbSchema } from "@/lib/seo"
import { StructuredData } from "@/components/seo/StructuredData"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function BlogPage() {
  return (
    <>
      <StructuredData
        data={createBreadcrumbSchema([
          { name: "ホーム", path: "/" },
          { name: "ブログ", path: "/blog" },
        ])}
      />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_40%),linear-gradient(to_bottom,_rgba(255,255,255,1),_rgba(240,253,250,0.9))]">
        <main className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <BookOpenText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-[0.18em] text-primary">
                    SURQ BLOG
                  </p>
                  <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                    調査と仮説検証の読みもの
                  </h1>
                </div>
              </div>

              <Button asChild variant="outline" className="rounded-full">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  ホームへ
                </Link>
              </Button>
            </div>

            <div className="mb-10 overflow-hidden rounded-[2rem] border border-primary/10 bg-white/90 shadow-[0_24px_80px_-48px_rgba(16,185,129,0.55)] backdrop-blur">
              <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.4fr_0.9fr] md:px-8 md:py-10">
                <div>
                  <Badge className="mb-4 rounded-full px-3 py-1 text-sm">
                    読むことで、集め方が変わる
                  </Badge>
                  <h2 className="mb-4 text-2xl font-bold leading-tight text-foreground md:text-3xl">
                    卒論の回答集めも、個人開発の需要確認も。
                    <br />
                    まずは「聞き方」を整える。
                  </h2>
                  <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                    SurQのブログでは、アンケート調査を実務として進めるうえで詰まりやすいポイントを、
                    学生と個人開発者の両方の目線で整理しています。
                  </p>
                </div>

                <Card className="border-emerald-100 bg-emerald-50/70 shadow-none">
                  <CardHeader>
                    <div className="mb-3 flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-semibold">こんな人向け</span>
                    </div>
                    <CardTitle className="text-xl">読む前提を最短で揃える</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                    <p>卒業論文でアンケート調査を始めたい学生</p>
                    <p>作る前に需要検証したい個人開発者</p>
                    <p>回答が集まらず、配布導線まで見直したい人</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {blogPosts.map((post) => (
                <Card
                  key={post.slug}
                  className="group overflow-hidden border-0 bg-white/95 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.55)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <CardHeader className="pb-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                        {post.category}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        <span>{post.readingTime}</span>
                      </div>
                    </div>
                    <CardTitle className="text-2xl leading-tight">{post.title}</CardTitle>
                    <CardDescription className="pt-2 text-base leading-7">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {post.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full border border-primary/10 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        公開日: {formatDate(post.publishedAt)}
                      </p>
                      <Button asChild className="rounded-full">
                        <Link href={`/blog/${post.slug}`}>
                          記事を読む
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
