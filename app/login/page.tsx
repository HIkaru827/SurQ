"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth"

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Firebase authentication
      await signIn(email, password)
      
      setIsLoading(false)
      // Redirect to app (main functionality)
      window.location.href = "/app"
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      alert('ログインに失敗しました。もう一度お試しください。')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ホームに戻る
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">SurQ</h1>
          </div>
          <p className="text-muted-foreground">アカウントにログイン</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
            <CardDescription>メールアドレスとパスワードを入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">アカウントをお持ちでない方は</p>
              <Link href="/signup" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                新規登録はこちら
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">循環型無料システム</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                他の人のアンケートに答えてポイントを獲得し、自分のアンケートを無料で投稿できます
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
