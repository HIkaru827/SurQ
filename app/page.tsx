import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, MessageSquare, Users, Trophy, BarChart3, Zap, Star, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <div className="relative container mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8 flex items-center justify-center space-x-3">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-2xl">S</span>
              </div>
              <h1 className="text-4xl font-bold text-foreground">SurQ</h1>
            </div>

            {/* Main Heading */}
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              知見を循環させる
              <br />
              <span className="text-primary">アンケートプラットフォーム</span>
            </h2>

            {/* Description */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              SurQは、質問者と回答者がお互いに価値を提供し合う循環型システムです。
              <br />
              アンケートに答えてポイントを獲得し、そのポイントで自分のアンケートを作成・配布できます。
            </p>

            {/* CTA Button */}
            <Link href="/login">
              <Button 
                size="lg" 
                className="text-xl px-12 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
              >
                アプリを使う
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </Link>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">循環型</div>
                <div className="text-muted-foreground">知見共有システム</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">ポイント制</div>
                <div className="text-muted-foreground">公平な価値交換</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">リアルタイム</div>
                <div className="text-muted-foreground">即座に結果確認</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              なぜSurQなのか？
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              従来のアンケートツールとは異なる、持続可能な知見共有の仕組みを提供します
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-background">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-4">循環型システム</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  回答で得たポイントでアンケートを作成。
                  知見の共有が持続的に続く新しい仕組み
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-background">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-4">ポイント獲得</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  質問の種類に応じてポイントを獲得。
                  バッジやランキングでモチベーション維持
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-background">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-4">リアルタイム分析</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  回答状況をリアルタイムで把握。
                  直感的なダッシュボードで洞察を獲得
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-background">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-4">簡単作成</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  直感的なインターフェースで、
                  誰でも質の高いアンケートを素早く作成
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-background">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-4">コミュニティ</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  質問者と回答者がお互いに価値を提供し、
                  知見を共有するコミュニティを形成
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-background">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-4">品質保証</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  ポイントシステムにより、
                  質の高い質問と回答を促進
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              循環の仕組み
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              3つのステップで始める持続的な知見共有
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <span className="text-3xl font-bold text-primary-foreground">1</span>
              </div>
              <h4 className="text-2xl font-semibold mb-6">アンケートに回答</h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                他のユーザーが作成したアンケートに回答して、質問の種類に応じたポイントを獲得します
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <span className="text-3xl font-bold text-primary-foreground">2</span>
              </div>
              <h4 className="text-2xl font-semibold mb-6">ポイントで作成</h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                獲得したポイントを使って、自分のアンケートを作成・公開します
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <span className="text-3xl font-bold text-primary-foreground">3</span>
              </div>
              <h4 className="text-2xl font-semibold mb-6">知見を共有</h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                他のユーザーがあなたのアンケートに回答し、新たな知見とポイントを獲得できます
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            今すぐ始めよう
          </h3>
          <p className="text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
            知見の循環に参加して、新しいアンケート体験を始めましょう
          </p>
          <Link href="/login">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-xl px-12 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              アプリを使う
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold text-foreground">SurQ</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 SurQ. 知見を循環させるアンケートプラットフォーム
          </p>
        </div>
      </footer>
    </div>
  )
}