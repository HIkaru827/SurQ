"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, Trophy, Star, CheckCircle, ExternalLink, Clock, Info, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import { surveyEvents } from "@/lib/analytics"
import { authenticatedFetch } from "@/lib/api-client"

interface Survey {
  id: string
  type: 'native' | 'google_form'
  title: string
  description?: string | null
  questions?: any[]
  response_count: number
  google_form_url?: string
  embedded_url?: string
  estimated_time?: number
  category?: string
  target_audience?: string
  creator_id: string
}

export default function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const [surveyId, setSurveyId] = useState<string>('')
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAlreadyAnswered, setHasAlreadyAnswered] = useState(false)

  // ネイティブ形式用の状態
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [responseStartTime, setResponseStartTime] = useState<number>(Date.now())
  const [respondentName, setRespondentName] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [showSurveyInfo, setShowSurveyInfo] = useState(true)
  const [surveyStarted, setSurveyStarted] = useState(false)

  // Googleフォーム用の状態
  const [googleFormOpened, setGoogleFormOpened] = useState(false)
  const [googleFormStartTime, setGoogleFormStartTime] = useState<string | null>(null)
  const [confirmingCompletion, setConfirmingCompletion] = useState(false)
  const [reportingAccessError, setReportingAccessError] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setSurveyId(resolvedParams.id)
      fetchSurvey(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (user?.email) {
      setRespondentEmail(user.email)
      setRespondentName(user.displayName || 'Anonymous')
      setShowUserForm(false)
    } else {
      setShowUserForm(true)
    }
  }, [user])

  const fetchSurvey = async (id: string) => {
    try {
      const response = await fetch(`/api/surveys/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSurvey(data.survey)
        
        // Check if user has already answered this survey
        if (user?.email) {
          checkIfAlreadyAnswered(id, user.email)
        }
      } else if (response.status === 404) {
        setError('アンケートが見つかりません')
      } else {
        setError('アンケートの読み込みに失敗しました')
      }
    } catch (error) {
      console.error('Error fetching survey:', error)
      setError('アンケートの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const checkIfAlreadyAnswered = async (surveyId: string, email: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/responses?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        setHasAlreadyAnswered(data.hasResponded)
      }
    } catch (error) {
      console.error('Error checking response status:', error)
    }
  }

  // Googleフォームを開く（クリック追跡）
  const handleOpenGoogleForm = async () => {
    if (!user?.email || !survey) return

    const startTime = new Date().toISOString()
    setGoogleFormStartTime(startTime)
    setGoogleFormOpened(true)

    try {
      // クリック追跡APIを呼び出す
      await authenticatedFetch(`/api/surveys/${surveyId}/google-form-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          started_at: startTime,
        }),
      })

      // Googleフォームを新しいタブで開く
      window.open(survey.google_form_url, '_blank')
    } catch (error) {
      console.error('Error tracking form open:', error)
      toast.error('エラーが発生しました')
    }
  }

  // 回答完了を報告
  const handleConfirmCompletion = async () => {
    if (!user?.email || !survey || !googleFormStartTime) return

    setConfirmingCompletion(true)

    try {
      const response = await authenticatedFetch(`/api/surveys/${surveyId}/google-form-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          started_at: googleFormStartTime,
          completed_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast.success('回答が記録されました！')
        setIsCompleted(true)
        setTimeout(() => setShowCompletion(true), 500)
        
        // キャッシュをクリア
        sessionStorage.removeItem('cached_surveys')
        sessionStorage.removeItem('cached_surveys_time')
        if (user?.uid) {
          sessionStorage.removeItem(`profile_${user.uid}`)
        }
      } else {
        const data = await response.json()
        toast.error(data.error || '回答の記録に失敗しました')
      }
    } catch (error) {
      console.error('Error confirming completion:', error)
      toast.error('回答の記録に失敗しました')
    } finally {
      setConfirmingCompletion(false)
    }
  }

  // アクセス権限エラーを報告
  const handleReportAccessError = async () => {
    if (!user?.email || !survey) return

    setReportingAccessError(true)

    try {
      const response = await authenticatedFetch(`/api/surveys/${surveyId}/google-form-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'access_error',
        }),
      })

      if (response.ok) {
        toast.success('アクセス権限の問題を投稿者に報告しました')
      } else {
        const data = await response.json()
        toast.error(data.error || '報告に失敗しました')
      }
    } catch (error) {
      console.error('Error reporting access error:', error)
      toast.error('報告に失敗しました')
    } finally {
      setReportingAccessError(false)
    }
  }

  // ネイティブ形式の回答送信
  const submitNativeSurvey = async () => {
    if (!respondentEmail || !respondentName) {
      toast.error('回答者情報が不足しています')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: answers,
          respondent_email: respondentEmail,
          respondent_name: respondentName,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const responseTime = Date.now() - responseStartTime
        surveyEvents.submitResponse(surveyId, responseTime)
        
        setIsCompleted(true)
        setTimeout(() => setShowCompletion(true), 500)
        toast.success('アンケートを送信しました！')
        
        // キャッシュをクリア
        sessionStorage.removeItem('cached_surveys')
        sessionStorage.removeItem('cached_surveys_time')
        if (user?.uid) {
          sessionStorage.removeItem(`profile_${user.uid}`)
        }
      } else {
        toast.error(data.error || 'アンケートの送信に失敗しました')
      }
    } catch (error) {
      console.error('Error submitting survey:', error)
      toast.error('アンケートの送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">アンケートを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">エラーが発生しました</h2>
            <p className="text-muted-foreground mb-6">{error || 'アンケートが見つかりません'}</p>
            <Link href="/app">
              <Button>アプリに戻る</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 回答済みの場合
  if (hasAlreadyAnswered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-4">既に回答済みです</h2>
            <p className="text-muted-foreground mb-6">
              このアンケートには既に回答していただいております。ご協力ありがとうございました。
            </p>
            <div className="space-y-3">
              <Link href="/app">
                <Button className="w-full">アプリに戻る</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 完了画面
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card
          className={cn(
            "w-full max-w-md text-center transition-all duration-700",
            showCompletion ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
        >
          <CardHeader className="pb-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-primary">アンケート完了！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground">ご協力ありがとうございました</p>
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />回答完了！
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/app">アプリに戻る</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Googleフォーム形式の表示
  if (survey.type === 'google_form') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* ヘッダー */}
          <div className="mb-6">
            <Link href="/app">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
            </Link>
          </div>

          {/* アンケート情報 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">Googleフォーム</Badge>
                    {survey.category && (
                      <Badge variant="outline">{survey.category}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl mb-2">{survey.title}</CardTitle>
                  {survey.description && (
                    <p className="text-muted-foreground">{survey.description}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 情報カード */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {survey.estimated_time && (
                  <div className="bg-muted/30 p-4 rounded-lg text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-lg font-bold">{survey.estimated_time}分</div>
                    <div className="text-xs text-muted-foreground">所要時間</div>
                  </div>
                )}
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <div className="text-lg font-bold">{survey.response_count || 0}</div>
                  <div className="text-xs text-muted-foreground">回答数</div>
                </div>
                {survey.target_audience && (
                  <div className="bg-muted/30 p-4 rounded-lg text-center col-span-2">
                    <div className="text-sm font-medium">対象者</div>
                    <div className="text-xs text-muted-foreground">{survey.target_audience}</div>
                  </div>
                )}
              </div>

              {/* 回答フロー */}
              {!googleFormOpened ? (
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      「回答する」ボタンをクリックすると、Googleフォームが新しいタブで開きます。
                      回答後、このページに戻って「回答しました」ボタンをクリックしてください。
                    </AlertDescription>
                  </Alert>

                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={handleOpenGoogleForm}
                    disabled={!user}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Googleフォームで回答する
                  </Button>

                  {!user && (
                    <p className="text-sm text-center text-muted-foreground">
                      回答するにはログインが必要です
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Googleフォームが開きました。回答が完了したら、下のボタンをクリックしてください。
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="flex-1"
                      onClick={handleOpenGoogleForm}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      もう一度開く
                    </Button>

                    <Button 
                      size="lg" 
                      className="flex-1"
                      onClick={handleConfirmCompletion}
                      disabled={confirmingCompletion}
                    >
                      {confirmingCompletion ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          処理中...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          回答しました
                        </>
                      )}
                    </Button>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Googleフォームで回答を送信した後に「回答しました」ボタンを押してください。
                      虚偽の報告は通報の対象となります。
                    </AlertDescription>
                  </Alert>

                  <Button 
                    size="lg" 
                    variant="destructive"
                    className="w-full"
                    onClick={handleReportAccessError}
                    disabled={reportingAccessError}
                  >
                    {reportingAccessError ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        報告中...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        見れません（リンクが開けない・権限がないなど）
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* プレビュー（iframe） */}
          {survey.embedded_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">プレビュー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ height: '600px' }}>
                  <iframe
                    src={survey.embedded_url}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    className="rounded-lg"
                  >
                    読み込んでいます…
                  </iframe>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  ※ このプレビューは参考用です。実際の回答は新しいタブで行ってください。
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // 以下、ネイティブ形式の表示（既存のロジック）
  // アンケート情報表示
  if (showSurveyInfo && !surveyStarted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-6">
            <Link href="/app">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <Badge variant="outline" className="w-fit mb-2">従来形式</Badge>
              <CardTitle className="text-2xl">{survey.title}</CardTitle>
              {survey.description && (
                <p className="text-muted-foreground mt-2">{survey.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">{survey.questions?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">質問数</div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">{survey.response_count || 0}</div>
                  <div className="text-sm text-muted-foreground">回答数</div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">~{Math.ceil((survey.questions?.length || 0) * 0.5)}</div>
                  <div className="text-sm text-muted-foreground">予想時間（分）</div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-primary">
                  <Trophy className="w-5 h-5" />
                  <span className="font-medium">4回答で投稿権+1回！</span>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    setShowSurveyInfo(false)
                    setSurveyStarted(true)
                  }}
                >
                  アンケートを開始
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ユーザー情報入力フォーム（未ログインユーザー用）
  if (showUserForm) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild className="p-2">
                <Link href="/app">
                  <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-sm">戻る</span>
                </Link>
              </Button>
              <div className="text-center flex-1 mx-4">
                <h1 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1">{survey.title}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">回答者情報の入力</p>
              </div>
              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
          <Card className="border-0 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">回答者情報</CardTitle>
              <p className="text-muted-foreground text-sm sm:text-base">
                アンケートに回答するために、お名前とメールアドレスをご入力ください。
              </p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">お名前 *</Label>
                <Input
                  id="name"
                  placeholder="山田太郎"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div className="pt-2 sm:pt-4">
                <Button 
                  onClick={() => {
                    if (!respondentEmail || !respondentName) {
                      toast.error('名前とメールアドレスを入力してください')
                      return
                    }
                    setShowUserForm(false)
                    setShowSurveyInfo(false)
                    setSurveyStarted(true)
                  }}
                  disabled={!respondentEmail || !respondentName}
                  className="w-full h-10 sm:h-11 text-sm sm:text-base"
                >
                  アンケートを開始する
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ネイティブ形式のアンケート回答画面
  const totalQuestions = survey.questions?.length || 0
  const progress = ((currentQuestion + 1) / totalQuestions) * 100
  const currentQ = survey.questions?.[currentQuestion]
  const currentAnswer = answers[currentQ?.id]

  const canProceed = (() => {
    if (!currentAnswer || currentAnswer === "") return false
    
    if ((currentQ as any)?.allowMultiple && currentAnswer.includes('__SEPARATOR__')) {
      const parts = currentAnswer.split('__SEPARATOR__')
      const selectedOptions = parts.filter(item => item.startsWith('__selected__:'))
      const otherPart = parts.find(item => item.startsWith('__other__:'))
      
      if (selectedOptions.length === 0 && !otherPart) return false
      if (otherPart && otherPart.replace('__other__:', '').trim() === '') return false
      
      return true
    }
    
    if (currentAnswer.startsWith('__other__:')) {
      return currentAnswer.replace('__other__:', '').trim() !== ''
    }
    
    return true
  })()

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      submitNativeSurvey()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="p-2">
              <Link href="/app">
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="text-sm">戻る</span>
              </Link>
            </Button>
            <div className="text-center flex-1 mx-4">
              <h1 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1">{survey.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {currentQuestion + 1} / {totalQuestions}
              </p>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* プログレスバー */}
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* 質問コンテンツ */}
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-balance leading-tight">{currentQ?.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            {/* 複数選択 */}
            {currentQ?.type === "multiple-choice" && (
              <div className="space-y-3">
                <RadioGroup
                  value={currentAnswer?.startsWith('__other__:') ? '__other__' : currentAnswer}
                  onValueChange={(value) => {
                    if (value === '__other__') {
                      if (!currentAnswer?.startsWith('__other__:')) {
                        handleAnswer(currentQ.id, '__other__:')
                      }
                    } else {
                      handleAnswer(currentQ.id, value)
                    }
                  }}
                  className="space-y-3"
                >
                  {currentQ.options?.map((option: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                  
                  {(currentQ as any).allowOther && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="__other__" id="other-option" />
                        <Label htmlFor="other-option" className="cursor-pointer text-base">
                          その他
                        </Label>
                      </div>
                      
                      {currentAnswer?.startsWith('__other__:') && (
                        <div className="ml-8">
                          <Input
                            placeholder="具体的に入力してください"
                            value={currentAnswer.replace('__other__:', '')}
                            onChange={(e) => handleAnswer(currentQ.id, '__other__:' + e.target.value)}
                            className="text-base"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </RadioGroup>
              </div>
            )}

            {/* はい/いいえ */}
            {currentQ?.type === "yes-no" && (
              <RadioGroup
                value={currentAnswer}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="はい" id="yes" />
                  <Label htmlFor="yes" className="flex-1 cursor-pointer text-base">はい</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="いいえ" id="no" />
                  <Label htmlFor="no" className="flex-1 cursor-pointer text-base">いいえ</Label>
                </div>
              </RadioGroup>
            )}

            {/* 評価 */}
            {currentQ?.type === "rating" && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>全く満足していない</span>
                  <span>とても満足している</span>
                </div>
                <RadioGroup
                  value={currentAnswer}
                  onValueChange={(value) => handleAnswer(currentQ.id, value)}
                  className="flex justify-center space-x-4"
                >
                  {Array.from({ length: currentQ.scale || 5 }, (_, i) => i + 1).map((rating) => (
                    <div key={rating} className="flex flex-col items-center space-y-2">
                      <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} className="w-6 h-6" />
                      <Label htmlFor={`rating-${rating}`} className="cursor-pointer text-lg font-semibold">
                        {rating}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* テキスト */}
            {currentQ?.type === "text" && (
              <Textarea
                placeholder="こちらにご意見をお聞かせください..."
                value={currentAnswer || ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                className="min-h-32 text-base"
              />
            )}
          </CardContent>
        </Card>

        {/* ナビゲーション */}
        <div className="flex justify-between items-center mt-6 sm:mt-8 gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center bg-transparent h-10 sm:h-11 px-3 sm:px-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">前の質問</span>
          </Button>

          <Button 
            onClick={handleNext} 
            disabled={!canProceed || submitting} 
            className="flex items-center h-10 sm:h-11 px-3 sm:px-4 flex-1 max-w-[200px]"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 mr-1 sm:mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm sm:text-base">送信中...</span>
              </>
            ) : currentQuestion === totalQuestions - 1 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">送信</span>
              </>
            ) : (
              <>
                <span className="text-sm sm:text-base">次の質問</span>
                <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
