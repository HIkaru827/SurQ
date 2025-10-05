"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Send, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"

export default function ContactPage() {
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !content.trim()) {
      setStatus("error")
      setErrorMessage("件名と内容の両方を入力してください")
      return
    }

    setIsLoading(true)
    setStatus("idle")

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          content: content.trim(),
          userEmail: user?.email || null,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        setStatus("success")
        setSubject("")
        setContent("")
      } else {
        const data = await response.json()
        throw new Error(data.error || '送信に失敗しました')
      }
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "送信に失敗しました。しばらく時間をおいてから再度お試しください。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">SurQ</span>
            </div>
            <Link href="/app">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                アプリに戻る
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Mail className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">お問い合わせ</h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              ご質問やご要望がございましたら、お気軽にお問い合わせください。
            </p>

            {/* X Account */}
            <div className="flex justify-center">
              <a
                href="https://x.com/hikaruru_k"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="font-medium">@hikaruru_k</span>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>お問い合わせフォーム</CardTitle>
              <CardDescription>
                内容を確認の上、回答いたします。お気軽にご連絡ください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === "success" ? (
                <div className="py-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600 mb-2">送信完了</h3>
                  <p className="text-muted-foreground mb-6">
                    お問い合わせありがとうございます。<br />
                    内容を確認の上、回答いたします。
                  </p>
                  <Button onClick={() => setStatus("idle")}>
                    新しいお問い合わせを送信
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {status === "error" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="subject">件名 *</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="お問い合わせの件名を入力してください"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">内容 *</Label>
                    <Textarea
                      id="content"
                      placeholder="お問い合わせ内容を詳しく入力してください"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      required
                    />
                  </div>

                  {user?.email && (
                    <div className="text-sm text-muted-foreground">
                      ログインユーザー: {user.email}
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      "送信中..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        送信
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}