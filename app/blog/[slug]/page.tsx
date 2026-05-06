import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react"
import { blogPosts, getBlogPost } from "@/lib/blog"
import { absoluteUrl, createBreadcrumbSchema, createMetadata } from "@/lib/seo"
import { StructuredData } from "@/components/seo/StructuredData"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type BlogPostPageProps = {
  params: Promise<{
    slug: string
  }>
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    return createMetadata({
      title: "記事が見つかりません",
      description: "指定された記事は見つかりませんでした。",
      path: `/blog/${slug}`,
      noindex: true,
    })
  }

  return createMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.keywords,
    type: "article",
  })
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = blogPosts.filter((entry) => entry.slug !== post.slug)

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    inLanguage: "ja-JP",
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    author: {
      "@type": "Organization",
      name: "SurQ",
    },
    publisher: {
      "@type": "Organization",
      name: "SurQ",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/surq_logo.png"),
      },
    },
  }

  return (
    <>
      <StructuredData data={articleSchema} />
      <StructuredData
        data={createBreadcrumbSchema([
          { name: "ホーム", path: "/" },
          { name: "ブログ", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <div className="min-h-screen bg-[linear-gradient(to_bottom,_rgba(236,253,245,0.7),_rgba(255,255,255,1)_18rem)]">
        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Button asChild variant="ghost" className="mb-6 rounded-full">
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4" />
                ブログ一覧へ
              </Link>
            </Button>

            <div className="mb-10 overflow-hidden rounded-[2rem] border border-primary/10 bg-white shadow-[0_24px_80px_-48px_rgba(16,185,129,0.45)]">
              <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,1),_rgba(240,253,250,0.95))] px-6 py-10 md:px-10 md:py-12">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full px-3 py-1">{post.category}</Badge>
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    {post.readingTime}
                  </span>
                </div>

                <h1 className="max-w-4xl text-3xl font-bold leading-tight text-foreground md:text-5xl">
                  {post.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                  {post.description}
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <article className="rounded-[2rem] border border-border/70 bg-white px-6 py-8 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.45)] md:px-10">
                <div className="mb-8 flex flex-wrap gap-2">
                  {post.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="space-y-10">
                  {post.sections.map((section) => (
                    <section key={section.heading} className="space-y-5">
                      <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                        {section.heading}
                      </h2>
                      {section.paragraphs.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="text-base leading-8 text-muted-foreground md:text-lg"
                        >
                          {paragraph}
                        </p>
                      ))}
                      {section.bullets ? (
                        <ul className="space-y-3 rounded-2xl border border-primary/10 bg-emerald-50/60 px-5 py-5 text-sm leading-7 text-foreground md:text-base">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-3">
                              <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ))}
                </div>
              </article>

              <aside className="space-y-6">
                <Card className="border-primary/10 bg-emerald-50/70 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-xl">SurQでできること</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                    <p>他の人のアンケートに回答しながら、自分の調査も進められます。</p>
                    <p>卒論の回答集めや、個人開発の需要検証の入口として使いやすい設計です。</p>
                    <Button asChild className="mt-2 w-full rounded-full">
                      <Link href="/surveys">
                        公開中のアンケートを見る
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-xl">あわせて読みたい</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relatedPosts.map((entry) => (
                      <Link
                        key={entry.slug}
                        href={`/blog/${entry.slug}`}
                        className="block rounded-2xl border border-border px-4 py-4 transition-colors hover:bg-muted/60"
                      >
                        <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-primary">
                          {entry.category}
                        </p>
                        <p className="font-semibold leading-6 text-foreground">{entry.title}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
