"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { authenticatedFetch } from "@/lib/api-client"
import { calculateAvailablePosts, answersUntilNextPost } from "@/lib/points"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, Info, Loader2, Send } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  surveys_answered: number
  surveys_created: number
}

function CreateSurveyPageInner() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  // フォーム状態
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [googleFormUrl, setGoogleFormUrl] = useState("")
  const [estimatedTime, setEstimatedTime] = useState<number>(5)
  const [category, setCategory] = useState<string>("")
  const [targetAudience, setTargetAudience] = useState("")

  // ユーザー情報の取得
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        const response = await authenticatedFetch(`/api/users/${user.email}`)
        if (!response.ok) throw new Error("ユーザー情報の取得に失敗しました")
        
        const data = await response.json()
        setUserProfile({
          surveys_answered: data.surveys_answered || 0,
          surveys_created: data.surveys_created || 0,
        })
      } catch (error) {
        console.error("Error fetching user profile:", error)
        setError("ユーザー情報の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [user])

  // 編集モード: 既存データの取得
  useEffect(() => {
    async function fetchSurveyData() {
      if (!editId || !user) return

      try {
        const response = await authenticatedFetch(`/api/surveys/${editId}`)
        if (!response.ok) throw new Error("アンケートの取得に失敗しました")
        
        const data = await response.json()
        const survey = data.survey

        // Googleフォーム形式のみ編集可能
        if (survey.type !== 'google_form') {
          setError("従来形式のアンケートは編集できません")
          return
        }

        // 作成者チェック
        if (survey.creator_id !== user.uid) {
          setError("このアンケートを編集する権限がありません")
          return
        }

        // フォームにデータを設定
        setTitle(survey.title || "")
        setDescription(survey.description || "")
        setGoogleFormUrl(survey.google_form_url || "")
        setEstimatedTime(survey.estimated_time || 5)
        setCategory(survey.category || "")
        setTargetAudience(survey.target_audience || "")
      } catch (error) {
        console.error("Error fetching survey:", error)
        setError("アンケートの取得に失敗しました")
      }
    }

    fetchSurveyData()
  }, [editId, user])

  // GoogleフォームURLの埋め込み用URLへの変換
  const convertToEmbeddedUrl = (url: string): string => {
    try {
      // https://docs.google.com/forms/d/e/FORM_ID/viewform
      // → https://docs.google.com/forms/d/e/FORM_ID/viewform?embedded=true
      if (url.includes("docs.google.com/forms")) {
        const urlObj = new URL(url)
        urlObj.searchParams.set("embedded", "true")
        return urlObj.toString()
      }
      return url
    } catch {
      return url
    }
  }

  // URLバリデーション
  const isValidGoogleFormUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === "docs.google.com" && url.includes("/forms/")
    } catch {
      return false
    }
  }

  // 投稿処理
  const handleSubmit = async (isPublished: boolean) => {
    if (!user?.email) {
      setError("ログインが必要です")
      return
    }

    if (!userProfile) {
      setError("ユーザー情報の読み込み中です")
      return
    }

    // バリデーション
    if (!title.trim()) {
      setError("タイトルを入力してください")
      return
    }

    if (!googleFormUrl.trim()) {
      setError("GoogleフォームのURLを入力してください")
      return
    }

    if (!isValidGoogleFormUrl(googleFormUrl)) {
      setError("有効なGoogleフォームのURLを入力してください")
      return
    }

    if (!category) {
      setError("カテゴリーを選択してください")
      return
    }

    // 公開時のみ投稿権限チェック
    if (isPublished) {
      const availablePosts = calculateAvailablePosts(
        userProfile.surveys_answered,
        userProfile.surveys_created
      )

      if (availablePosts <= 0) {
        const answersNeeded = answersUntilNextPost(userProfile.surveys_answered)
        setError(`投稿するには、あと${answersNeeded}件のアンケートに回答してください`)
        return
      }
    }

    setSubmitting(true)
    setError(null)

    try {
      const surveyData = {
        type: "google_form",
        title: title.trim(),
        description: description.trim() || null,
        google_form_url: googleFormUrl.trim(),
        embedded_url: convertToEmbeddedUrl(googleFormUrl.trim()),
        estimated_time: estimatedTime,
        category: category,
        target_audience: targetAudience.trim() || null,
        is_published: isPublished,
      }

      let response
      let resultId

      if (editId) {
        // 編集モード: PUT
        response = await authenticatedFetch(`/api/surveys/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(surveyData),
        })
        resultId = editId
      } else {
        // 新規作成モード: POST
        response = await authenticatedFetch("/api/surveys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(surveyData),
        })
        const result = await response.json()
        resultId = result.id
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "アンケートの保存に失敗しました")
      }
      
      // 成功したらリダイレクト
      if (isPublished) {
        router.push(`/survey/${resultId}`)
      } else {
        router.push("/profile")
      }
    } catch (error) {
      console.error("Error saving survey:", error)
      setError(error instanceof Error ? error.message : "アンケートの保存に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>ログインが必要です</CardTitle>
            <CardDescription>アンケートを投稿するにはログインしてください</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">ログイン</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availablePosts = userProfile
    ? calculateAvailablePosts(userProfile.surveys_answered, userProfile.surveys_created)
    : 0
  const answersNeeded = userProfile ? answersUntilNextPost(userProfile.surveys_answered) : 4
  const canPost = availablePosts > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  戻る
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {editId ? "アンケートを編集" : "アンケートを投稿"}
                </h1>
                <p className="text-sm text-gray-600 mt-1">GoogleフォームのURLを入力してください</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={canPost ? "default" : "secondary"} className="text-sm px-3 py-1">
                投稿可能: {availablePosts}件
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 投稿権限の説明 */}
        {!canPost && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              投稿するには、あと<strong className="font-bold">{answersNeeded}件</strong>のアンケートに回答してください。
              （4件の回答で1件投稿できます）
            </AlertDescription>
          </Alert>
        )}

        {/* お知らせ */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong className="font-semibold">お知らせ：</strong> 新規アンケートの作成方法が変更されました。
            今後はGoogleフォーム形式での投稿のみとなります。
          </AlertDescription>
        </Alert>

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 投稿フォーム */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>アンケートの基本情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* タイトル */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  タイトル <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="例: 大学生の朝食習慣調査"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
                <p className="text-xs text-gray-500">{title.length}/100</p>
              </div>

              {/* 説明 */}
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  placeholder="このアンケートの目的や概要を記入してください"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">{description.length}/500</p>
              </div>

              {/* GoogleフォームURL */}
              <div className="space-y-2">
                <Label htmlFor="googleFormUrl">
                  GoogleフォームURL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="googleFormUrl"
                  type="url"
                  placeholder="https://docs.google.com/forms/d/..."
                  value={googleFormUrl}
                  onChange={(e) => setGoogleFormUrl(e.target.value)}
                  required
                />
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Googleフォームの「送信」→「リンク」からURLを取得してください</p>
                    <p className="mt-1">
                      <strong>重要：</strong>フォーム設定で「回答を1回に制限する」のチェックを外してください
                    </p>
                  </div>
                </div>
                {googleFormUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full sm:w-auto"
                  >
                    <a href={googleFormUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      プレビュー
                    </a>
                  </Button>
                )}
              </div>

              {/* カテゴリー */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  カテゴリー <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="カテゴリーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student_life">学生生活</SelectItem>
                    <SelectItem value="career">進路・就活</SelectItem>
                    <SelectItem value="hobby">趣味・娯楽</SelectItem>
                    <SelectItem value="health">健康・ライフスタイル</SelectItem>
                    <SelectItem value="technology">テクノロジー</SelectItem>
                    <SelectItem value="social">社会・環境</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 所要時間 */}
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">所要時間（分）</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  min={1}
                  max={60}
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500">回答にかかる時間の目安を入力してください</p>
              </div>

              {/* 対象者 */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience">対象者（任意）</Label>
                <Input
                  id="targetAudience"
                  placeholder="例: 大学生、社会人、全ての方"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  maxLength={100}
                />
              </div>
            </CardContent>
          </Card>

          {/* 投稿ボタン */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/profile">キャンセル</Link>
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  下書き保存
                </>
              )}
            </Button>
            <Button 
              type="button" 
              onClick={() => handleSubmit(true)}
              disabled={!canPost || submitting} 
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  投稿中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  投稿する
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateSurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CreateSurveyPageInner />
    </Suspense>
  )
}
