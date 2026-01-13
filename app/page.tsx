"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, XCircle, AlertCircle, Users, Zap, Target } from "lucide-react"
import Link from "next/link"
import { StructuredData, organizationSchema, webApplicationSchema, faqSchema } from "@/components/seo/StructuredData"

export default function LandingPage() {
  return (
    <>
      {/* 構造化データ */}
      <StructuredData data={organizationSchema} />
      <StructuredData data={webApplicationSchema} />
      <StructuredData data={faqSchema} />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section - ファーストビュー */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <div className="relative container mx-auto px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {/* Logo */}
              <div className="mb-6 flex items-center justify-center space-x-3">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-2xl">S</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground">SurQ</h1>
              </div>

              {/* Main Heading */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
                アンケートが集まらない<br className="hidden sm:inline" />大学生へ。
              </h2>
              
              <p className="text-3xl md:text-4xl font-bold text-primary mb-6 leading-tight">
                「答える」だけで、<br className="sm:hidden" />あなたのアンケートも集まる。
              </p>

              {/* Description */}
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto">
                卒論・レポート・個人開発向け｜大学生同士で回答を交換する、無料Webアプリ
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  >
                    今すぐ始める（ログイン）
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-6 rounded-full w-full sm:w-auto"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  仕組みを見る
                </Button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full font-semibold">完全無料</span>
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full font-semibold">Googleフォーム対応</span>
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full font-semibold">大学生限定</span>
              </div>
            </div>
          </div>
        </section>

        {/* 共感セクション */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                こんな経験、ありませんか？
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-muted bg-background">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                    <div>
                      <CardTitle className="text-lg mb-2">SNSで拡散しても集まらない</CardTitle>
                      <CardDescription className="text-base">
                        Twitterで何度も投稿しても、回答数が全然増えない...
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2 border-muted bg-background">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                    <div>
                      <CardTitle className="text-lg mb-2">友達に頼るのが気まずい</CardTitle>
                      <CardDescription className="text-base">
                        何度も頼むのは申し訳ない。でも回答数が必要...
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2 border-muted bg-background">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                    <div>
                      <CardTitle className="text-lg mb-2">有料サービスは高すぎる</CardTitle>
                      <CardDescription className="text-base">
                        学生には厳しい価格設定。もっと手軽に使いたい...
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2 border-muted bg-background">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                    <div>
                      <CardTitle className="text-lg mb-2">締切が迫っているのに...</CardTitle>
                      <CardDescription className="text-base">
                        卒論の締切まであと少し。なのに回答数が足りない！
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* SurQとは？ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                SurQ（サーキュー）とは？
              </h3>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
                SurQは、アンケートを集めたい大学生同士が<br className="hidden sm:inline" />
                お互いに回答し合うことで成り立つ、<br className="hidden sm:inline" />
                <span className="text-primary font-bold">完全無料のWebアプリ</span>です。
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <Card className="border-0 shadow-lg bg-primary/5">
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-4">💰</div>
                    <CardTitle className="text-xl mb-3">完全無料</CardTitle>
                    <CardDescription className="text-base">
                      登録料・利用料は一切なし。<br />学生の味方です。
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-0 shadow-lg bg-primary/5">
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-4">📝</div>
                    <CardTitle className="text-xl mb-3">Googleフォーム対応</CardTitle>
                    <CardDescription className="text-base">
                      使い慣れたフォームを<br />そのまま使用可能。
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-0 shadow-lg bg-primary/5">
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-4">🎓</div>
                    <CardTitle className="text-xl mb-3">大学生限定</CardTitle>
                    <CardDescription className="text-base">
                      大学生向けアンケートに<br />特化しています。
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 仕組み（Give & Take） */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                SurQの仕組みはとてもシンプル
              </h3>
              <p className="text-xl text-muted-foreground">
                3ステップで始める、公平な回答交換システム
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl font-bold text-primary-foreground">1</span>
                </div>
                <h4 className="text-2xl font-semibold mb-4 text-foreground">他人のアンケートに回答</h4>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  まずは他の大学生のアンケートに回答します。<br />
                  回答するごとにポイントが貯まります。
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl font-bold text-primary-foreground">2</span>
                </div>
                <h4 className="text-2xl font-semibold mb-4 text-foreground">4件回答で投稿権を獲得</h4>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  4件のアンケートに回答すると、<br />
                  自分のアンケートを投稿できるようになります。
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl font-bold text-primary-foreground">3</span>
                </div>
                <h4 className="text-2xl font-semibold mb-4 text-foreground">回答が集まる</h4>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  投稿したアンケートに、<br />
                  他の大学生から回答が届きます。
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-2xl shadow-lg">
                <p className="text-xl md:text-2xl font-bold">
                  回答する人だけが、回答を集められる
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* なぜ集まりやすい？ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                なぜSurQなら、回答が集まりやすいの？
              </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-background">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-4">全員が同じ目的</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    全員がアンケートを集めたい大学生。だから真剣に回答してくれます。
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-background">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-4">公平な仕組み</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    回答しないと投稿できないルール。だから回答が循環します。
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-background">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-4">回答しやすい</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    質問内容が近く、学生視点で答えやすいアンケートばかり。
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* 向いている人 / 向いていない人 */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8">
              {/* 向いている人 */}
              <Card className="border-2 border-green-200 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <CardTitle className="text-2xl text-green-900 dark:text-green-100">
                      SurQが向いている人
                    </CardTitle>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <CardDescription className="text-base text-green-800 dark:text-green-200">
                        卒論・ゼミ・レポートのアンケートを集めたい
                      </CardDescription>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <CardDescription className="text-base text-green-800 dark:text-green-200">
                        数分で終わるアンケートを作っている
                      </CardDescription>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <CardDescription className="text-base text-green-800 dark:text-green-200">
                        他の人のアンケートにも協力できる
                      </CardDescription>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <CardDescription className="text-base text-green-800 dark:text-green-200">
                        無料でアンケートを集めたい
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 向いていない人 */}
              <Card className="border-2 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-6">
                    <XCircle className="w-8 h-8 text-orange-600" />
                    <CardTitle className="text-2xl text-orange-900 dark:text-orange-100">
                      SurQが向いていない人
                    </CardTitle>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <CardDescription className="text-base text-orange-800 dark:text-orange-200">
                        回答せずにアンケートだけ集めたい人
                      </CardDescription>
                    </div>
                    <div className="flex items-start space-x-3">
                      <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <CardDescription className="text-base text-orange-800 dark:text-orange-200">
                        社会人・企業向けの調査をしたい
                      </CardDescription>
                    </div>
                    <div className="flex items-start space-x-3">
                      <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <CardDescription className="text-base text-orange-800 dark:text-orange-200">
                        30分以上かかる長いアンケートを作りたい
                      </CardDescription>
                    </div>
                    <div className="flex items-start space-x-3">
                      <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <CardDescription className="text-base text-orange-800 dark:text-orange-200">
                        特定のターゲット層に絞った調査をしたい
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              まずは、他のアンケートに<br className="sm:hidden" />答えてみてください。
            </h3>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              回答するだけで、あなたのアンケートも前に進みます。<br />
              今すぐ無料で始めましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/app">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                >
                  アンケートに回答する
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-6 rounded-full bg-white hover:bg-white/90 text-primary border-2 border-white w-full sm:w-auto"
                >
                  ログインして始める
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">S</span>
                </div>
                <span className="text-2xl font-bold text-foreground">SurQ</span>
              </div>
              <p className="text-muted-foreground mb-6">
                大学生のための無料アンケート交換プラットフォーム
              </p>
            </div>



            <div className="border-t border-muted pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex flex-wrap justify-center space-x-6">
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    利用規約
                  </Link>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    プライバシーポリシー
                  </Link>
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    お問い合わせ
                  </Link>
                  <Link href="/sitemap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    サイトマップ
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground">
                  © 2026 SurQ. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
