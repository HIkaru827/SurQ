'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { authenticatedFetch } from '@/lib/api-client'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, User, Mail, Award, BarChart, Download } from 'lucide-react'

interface Survey {
  id: string
  title: string
  description: string | null
  creator_id: string
  questions: any[]
  is_published: boolean
  response_count: number
  respondent_points: number
  creator_points: number
  created_at: string
}

interface SurveyResponse {
  id: string
  survey_id: string
  survey_title: string
  survey_creator_id: string
  respondent_email: string
  respondent_name: string
  responses: Record<string, any>
  points_earned: number
  submitted_at: string
  created_at: string
}

export default function SurveyResponsesPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    
    fetchSurveyAndResponses()
  }, [user, loading, params.id])

  const fetchSurveyAndResponses = async () => {
    setIsLoading(true)
    setError('')

    try {
      // アンケート詳細を取得
      const surveyResponse = await authenticatedFetch(`/api/surveys/${params.id}`)
      if (!surveyResponse.ok) {
        throw new Error('アンケートが見つかりません')
      }
      const surveyData = await surveyResponse.json()
      
      // 作成者確認
      if (surveyData.creator_id !== user.uid) {
        throw new Error('このアンケートの回答を表示する権限がありません')
      }
      
      setSurvey(surveyData)

      // 回答データを取得
      const responsesResponse = await authenticatedFetch(`/api/surveys/${params.id}/responses`)
      if (responsesResponse.ok) {
        const responsesData = await responsesResponse.json()
        setResponses(responsesData.responses || [])
      }

    } catch (error) {
      console.error('Error fetching survey responses:', error)
      setError(error instanceof Error ? error.message : 'データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  const getQuestionText = (questionId: string) => {
    const question = survey?.questions?.find(q => q.id === questionId)
    return question?.question || questionId
  }

  const getQuestionType = (questionId: string) => {
    const question = survey?.questions?.find(q => q.id === questionId)
    return question?.type || 'unknown'
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">エラー</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link href="/app">ホームに戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">アンケートが見つかりません</h1>
          <Button asChild>
            <Link href="/app">ホームに戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Link>
            </Button>
            <div className="flex items-center space-x-4">
              <h1 className="font-semibold text-foreground">回答一覧</h1>
              <Badge variant="secondary">
                {responses.length}件の回答
              </Badge>
            </div>
            <div className="w-16"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Survey Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="w-5 h-5 text-primary" />
              <span>{survey.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {survey.description && (
              <p className="text-muted-foreground mb-4">{survey.description}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>作成日: {formatDate(survey.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Award className="w-4 h-4" />
                <span>回答報酬: {survey.respondent_points}pt</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <BarChart className="w-4 h-4" />
                <span>質問数: {survey.questions?.length || 0}問</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responses */}
        {responses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">
                <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">まだ回答がありません</h3>
                <p>このアンケートにはまだ誰も回答していません。</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {responses.map((response, index) => (
              <Card key={response.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-primary" />
                      <span>回答者 #{index + 1}</span>
                    </div>
                    <Badge variant="outline">{response.points_earned}pt 獲得</Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>{response.respondent_name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(response.submitted_at)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(response.responses).map(([questionId, answer]) => (
                      <div key={questionId}>
                        <div className="flex flex-col space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Q: {getQuestionText(questionId)}
                          </h4>
                          <div className="pl-4 py-2 bg-muted/30 rounded-md">
                            {Array.isArray(answer) ? (
                              <ul className="space-y-1">
                                {answer.map((item, i) => (
                                  <li key={i} className="text-sm">• {item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm">{String(answer)}</p>
                            )}
                          </div>
                        </div>
                        {Object.keys(response.responses).indexOf(questionId) < Object.keys(response.responses).length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}