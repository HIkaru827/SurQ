"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Send, AlertCircle, CheckCircle } from "lucide-react"

interface ContactDialogProps {
  children: React.ReactNode
}

export function ContactDialog({ children }: ContactDialogProps) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

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
      // メール送信用のダミーAPI（実際の実装では適切なAPIエンドポイントを使用）
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          content: content.trim(),
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        setStatus("success")
        setSubject("")
        setContent("")
        setTimeout(() => {
          setOpen(false)
          setStatus("idle")
        }, 2000)
      } else {
        throw new Error('送信に失敗しました')
      }
    } catch (error) {
      setStatus("error")
      setErrorMessage("送信に失敗しました。しばらく時間をおいてから再度お試しください。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            お問い合わせ
          </DialogTitle>
          <DialogDescription>
            ご質問やご要望がございましたら、お気軽にお問い合わせください。
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">送信完了</h3>
            <p className="text-muted-foreground">
              お問い合わせありがとうございます。<br />
              内容を確認の上、回答いたします。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                rows={6}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  "送信中..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    送信
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}