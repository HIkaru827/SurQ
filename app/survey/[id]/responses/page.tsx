"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { authenticatedFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Clock, AlertTriangle, Loader2, Flag } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface GoogleFormResponse {
  id: string
  user_id: string
  user_name: string
  user_email: string
  last_opened_at: string
  completed_at: string
  open_count: number
  estimated_duration_minutes: number
  is_reported: boolean
}

interface Survey {
  id: string
  title: string
  type: 'native' | 'google_form'
  creator_id: string
  response_count: number
}

export default function SurveyResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const [surveyId, setSurveyId] = useState<string>('')
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<GoogleFormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 通報ダイアログ
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportingResponse, setReportingResponse] = useState<GoogleFormResponse | null>(null)
  const [reportReason, setReportReason] = useState<string>('')
  const [reportDetails, setReportDetails] = useState<string>('')
  const [submittingReport, setSubmittingReport] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setSurveyId(resolvedParams.id)
      fetchData(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchData = async (id: string) => {
    if (!user) {
      setError('ログインが必要です')
      setLoading(false)
      return
    }

    try {
      // アンケート情報を取得
      const surveyResponse = await fetch(`/api/surveys/${id}`)
      if (!surveyResponse.ok) {
        throw new Error('アンケートが見つかりません')
      }
      const surveyData = await surveyResponse.json()
      setSurvey(surveyData.survey)

      // 作成者かチェック
      if (surveyData.survey.creator_id !== user.uid) {
        setError('このページにアクセスする権限がありません')
        setLoading(false)
        return
      }

      // Googleフォーム形式の場合のみ回答追跡情報を取得
      if (surveyData.survey.type === 'google_form') {
        const responsesResponse = await authenticatedFetch(`/api/surveys/${id}/google-form-responses`)
        if (responsesResponse.ok) {
          const responsesData = await responsesResponse.json()
          setResponses(responsesData.responses || [])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleReportClick = (response: GoogleFormResponse) => {
    setReportingResponse(response)
    setReportReason('')
    setReportDetails('')
    setReportDialogOpen(true)
  }

  const handleSubmitReport = async () => {
    if (!reportingResponse || !reportReason) {
      toast.error('通報理由を選択してください')
      return
    }

    setSubmittingReport(true)

    try {
      const response = await authenticatedFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: surveyId,
          survey_title: survey?.title,
          reported_user_id: reportingResponse.user_id,
          reported_user_name: reportingResponse.user_name,
          reason: reportReason,
          details: reportDetails,
          response_data: {
            last_opened_at: reportingResponse.last_opened_at,
            completed_at: reportingResponse.completed_at,
            estimated_duration_minutes: reportingResponse.estimated_duration_minutes,
          },
        }),
      })

      if (response.ok) {
        toast.success('通報を受け付けました')
        setReportDialogOpen(false)
        // 回答リストを更新
        fetchData(surveyId)
      } else {
        const data = await response.json()
        toast.error(data.error || '通報の送信に失敗しました')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('通報の送信に失敗しました')
    } finally {
      setSubmittingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>エラー</CardTitle>
            <CardDescription>{error || 'アンケートが見つかりません'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/profile">プロフィールに戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ネイティブ形式の場合は回答詳細画面へリダイレクト
  if (survey.type !== 'google_form') {
    router.push(`/survey/${surveyId}/results`)
    return null
  }

  // 所要時間の表示
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}時間${mins}分`
  }

  // 所要時間の警告判定
  const getDurationWarning = (minutes: number) => {
    if (minutes < 1) return { level: 'danger', text: '極端に短い' }
    if (minutes > 60) return { level: 'warning', text: '長時間経過' }
    return null
  }

  const completedResponses = responses.filter(r => r.completed_at)
  const pendingResponses = responses.filter(r => !r.completed_at)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
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
                <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
                <p className="text-sm text-gray-600 mt-1">回答状況</p>
              </div>
            </div>
            <Badge variant="default" className="text-sm px-3 py-1">
              Googleフォーム
            </Badge>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* サマリー */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">完了回答数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{completedResponses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">開始のみ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pendingResponses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">合計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{responses.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* 説明 */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>所要時間</strong>は「回答する」ボタンのクリックから「回答しました」ボタンのクリックまでの時間です。
            タブを開いたまま放置した場合は長時間になることがあります。
          </AlertDescription>
        </Alert>

        {/* 回答リスト */}
        <Card>
          <CardHeader>
            <CardTitle>回答一覧</CardTitle>
            <CardDescription>完了した回答のみ表示されます</CardDescription>
          </CardHeader>
          <CardContent>
            {completedResponses.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                まだ回答がありません
              </div>
            ) : (
              <div className="space-y-4">
                {completedResponses.map((response) => {
                  const durationWarning = getDurationWarning(response.estimated_duration_minutes)
                  
                  return (
                    <div
                      key={response.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{response.user_name}</span>
                            <span className="text-sm text-gray-500">({response.user_email})</span>
                            {response.is_reported && (
                              <Badge variant="destructive" className="text-xs">
                                通報済み
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">最終アクセス:</span>{' '}
                              {new Date(response.last_opened_at).toLocaleString('ja-JP')}
                            </div>
                            <div>
                              <span className="text-gray-500">完了:</span>{' '}
                              {new Date(response.completed_at).toLocaleString('ja-JP')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-gray-500">所要時間:</span>{' '}
                              <span className={cn(
                                "font-medium",
                                durationWarning?.level === 'danger' && "text-red-600",
                                durationWarning?.level === 'warning' && "text-amber-600"
                              )}>
                                {formatDuration(response.estimated_duration_minutes)}
                              </span>
                              {durationWarning && (
                                <Badge 
                                  variant={durationWarning.level === 'danger' ? 'destructive' : 'secondary'}
                                  className="text-xs ml-1"
                                >
                                  {durationWarning.text}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {response.open_count > 1 && (
                            <div className="text-xs text-gray-500 mt-1">
                              ※ {response.open_count}回アクセス
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReportClick(response)}
                          disabled={response.is_reported}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          通報
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 通報ダイアログ */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザーを通報</DialogTitle>
            <DialogDescription>
              不正な回答報告の疑いがある場合は通報してください。管理者が確認します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reportingResponse && (
              <div className="text-sm text-gray-600">
                <p><strong>ユーザー:</strong> {reportingResponse.user_name}</p>
                <p><strong>所要時間:</strong> {formatDuration(reportingResponse.estimated_duration_minutes)}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>通報理由 *</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_answered" id="not_answered" />
                  <Label htmlFor="not_answered" className="cursor-pointer">
                    回答していない（Googleフォームの回答数が合わない）
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="suspicious_duration" id="suspicious_duration" />
                  <Label htmlFor="suspicious_duration" className="cursor-pointer">
                    所要時間が不自然に短い
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer">
                    その他
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">詳細（任意）</Label>
              <Textarea
                id="details"
                placeholder="詳しい状況を入力してください"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={handleSubmitReport}
              disabled={!reportReason || submittingReport}
              variant="destructive"
            >
              {submittingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  送信中...
                </>
              ) : (
                '通報する'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
