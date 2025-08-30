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
import { ArrowLeft, ArrowRight, Trophy, Star, CheckCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"

// Mock survey data
const mockSurvey = {
  id: "1",
  title: "カフェの利用体験に関するアンケート",
  description: "あなたのカフェ利用体験について教えてください",
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "どのくらいの頻度でカフェを利用しますか？",
      options: ["毎日", "週に2-3回", "週に1回", "月に数回", "ほとんど利用しない"],
    },
    {
      id: 2,
      type: "rating",
      question: "当店のサービスに満足していますか？",
      scale: 5,
    },
    {
      id: 3,
      type: "multiple-choice",
      question: "最も重視するポイントは何ですか？",
      options: ["コーヒーの味", "価格", "雰囲気", "立地", "Wi-Fi環境"],
    },
    {
      id: 4,
      type: "text",
      question: "改善してほしい点があれば教えてください",
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "また利用したいと思いますか？",
      options: ["ぜひ利用したい", "機会があれば利用したい", "どちらでもない", "あまり利用したくない", "利用したくない"],
    },
  ],
  pointsReward: 50,
}

export default function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [surveyId, setSurveyId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [hasAlreadyAnswered, setHasAlreadyAnswered] = useState(false)
  const [respondentName, setRespondentName] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)

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

  // Show message if user has already answered
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
              <Link href="/profile?tab=answered">
                <Button variant="outline" className="w-full">回答履歴を見る</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalQuestions = survey.questions.length
  const progress = ((currentQuestion + 1) / totalQuestions) * 100

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleStartSurvey = () => {
    if (!respondentEmail || !respondentName) {
      toast.error('名前とメールアドレスを入力してください')
      return
    }
    setShowUserForm(false)
  }

  const submitSurvey = async () => {
    if (!respondentEmail || !respondentName) {
      toast.error('回答者情報が不足しています')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: answers,
          respondent_email: respondentEmail,
          respondent_name: respondentName,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsCompleted(true)
        setTimeout(() => setShowCompletion(true), 500)
        toast.success(`アンケートを送信しました！${data.points_earned}ポイント獲得！`)
        
        // キャッシュをクリアしてアプリページでの表示を更新
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

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      // Complete survey
      submitSurvey()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const currentQ = survey.questions[currentQuestion]
  const currentAnswer = answers[currentQ?.id]
  const canProceed = currentAnswer !== undefined && currentAnswer !== ""

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
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />+{survey.respondent_points} ポイント獲得
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

  // Show user information form for anonymous users
  if (showUserForm) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
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
              <div className="w-16" /> {/* Spacer for centering */}
            </div>
          </div>
        </header>

        {/* User Form */}
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
                  onClick={handleStartSurvey}
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-balance leading-tight">{currentQ.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            {/* Multiple Choice Questions */}
            {currentQ.type === "multiple-choice" && (
              <RadioGroup
                value={currentAnswer}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
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
              </RadioGroup>
            )}

            {/* Yes/No Questions */}
            {currentQ.type === "yes-no" && (
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

            {/* Rating Questions */}
            {currentQ.type === "rating" && (
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

            {/* Text Questions */}
            {currentQ.type === "text" && (
              <Textarea
                placeholder="こちらにご意見をお聞かせください..."
                value={currentAnswer || ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                className="min-h-32 text-base"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
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
