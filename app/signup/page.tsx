"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Lock, User, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { FirebaseError } from "firebase/app"

export default function SignupPage() {
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getErrorMessage = (error: any): string => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return 'このメールアドレスは既に登録されています。ログインしてみてください。'
        case 'auth/weak-password':
          return 'パスワードが弱すぎます。6文字以上の強いパスワードを使用してください。'
        case 'auth/invalid-email':
          return '無効なメールアドレス形式です。'
        case 'auth/network-request-failed':
          return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
        case 'auth/too-many-requests':
          return 'リクエストが多すぎます。しばらく時間をおいてからお試しください。'
        default:
          return `登録エラー: ${error.message}`
      }
    }
    return '登録に失敗しました。もう一度お試しください。'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません")
      return
    }

    if (!agreedToTerms) {
      setError("利用規約とプライバシーポリシーに同意してください")
      return
    }

    if (formData.password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      return
    }

    setIsLoading(true)

    try {
      // Firebase registration
      await signUp(formData.email, formData.password, formData.name)
      
      setIsLoading(false)
      // Redirect to app (main functionality)
      window.location.href = "/app"
    } catch (error) {
      console.error('Registration error:', error)
      setIsLoading(false)
      setError(getErrorMessage(error))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ホームに戻る
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-2xl font-bold text-emerald-600">SurQ</h1>
          </div>
          <p className="text-muted-foreground">新しいアカウントを作成</p>
        </div>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>新規登録</CardTitle>
            <CardDescription>アカウントを作成してSurQを始めましょう</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">お名前</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="山田太郎"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
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
                    placeholder="6文字以上のパスワード"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード確認</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="パスワードを再入力"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
                    利用規約
                  </Link>
                  と
                  <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
                    プライバシーポリシー
                  </Link>
                  に同意します
                </Label>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                {isLoading ? "アカウント作成中..." : "アカウントを作成"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">すでにアカウントをお持ちの方は</p>
              <Link href="/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                ログインはこちら
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Info */}
        <Card className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">🎉 登録後すぐに始められます</h3>
              <div className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
                <p>✓ 他の人のアンケートに答えてポイント獲得</p>
                <p>✓ 獲得したポイントで自分のアンケートを投稿</p>
                <p>✓ すべて無料で利用可能</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
