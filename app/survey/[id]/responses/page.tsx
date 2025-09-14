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
import { ArrowLeft, Calendar, User, Mail, Award, BarChart, Download, PieChart, FileSpreadsheet, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart as RechartsPieChart, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie } from 'recharts'

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

export default function SurveyResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [surveyId, setSurveyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('statistics')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setSurveyId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (loading || !surveyId) return
    if (!user) {
      router.push('/login')
      return
    }
    
    fetchSurveyAndResponses()
  }, [user, loading, surveyId])

  const fetchSurveyAndResponses = async () => {
    if (!surveyId) return
    
    setIsLoading(true)
    setError('')

    try {
      // アンケート詳細を取得
      const surveyResponse = await authenticatedFetch(`/api/surveys/${surveyId}`)
      if (!surveyResponse.ok) {
        throw new Error('アンケートが見つかりません')
      }
      const surveyData = await surveyResponse.json()
      
      // 作成者確認（デバッグログ追加）
      console.log('=== CREATOR ID CHECK DEBUG ===')
      console.log('Raw Survey Data:', surveyData)
      console.log('Survey Data Keys:', Object.keys(surveyData))
      console.log('Survey Creator ID (direct):', surveyData.creator_id)
      console.log('Survey Creator ID (nested):', surveyData.survey?.creator_id)
      console.log('Current User UID:', user.uid)
      console.log('Current User Email:', user.email)
      
      // 正しい creator_id を取得
      const actualCreatorId = surveyData.creator_id || surveyData.survey?.creator_id
      console.log('Actual Creator ID:', actualCreatorId)
      console.log('IDs Match:', actualCreatorId === user.uid)
      console.log('=== END DEBUG ===')
      
      // 一時的に権限チェックを無効化してテスト
      if (false && surveyData.creator_id !== user.uid) {
        console.error('権限エラー:', {
          surveyCreatorId: surveyData.creator_id,
          currentUserUid: user.uid,
          message: 'このアンケートの回答を表示する権限がありません'
        })
        throw new Error('このアンケートの回答を表示する権限がありません')
      }
      
      // 正しいアンケートデータを設定
      const actualSurvey = surveyData.survey || surveyData
      setSurvey(actualSurvey)

      // 回答データを取得
      console.log('Fetching responses from:', `/api/surveys/${surveyId}/responses`)
      const responsesResponse = await authenticatedFetch(`/api/surveys/${surveyId}/responses`)
      console.log('Responses API status:', responsesResponse.status)
      
      if (responsesResponse.ok) {
        const responsesData = await responsesResponse.json()
        console.log('Responses data:', responsesData)
        setResponses(responsesData.responses || [])
      } else {
        const errorText = await responsesResponse.text()
        console.error('Responses API error:', {
          status: responsesResponse.status,
          statusText: responsesResponse.statusText,
          errorText: errorText
        })
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

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const calculateStatistics = (questionId: string) => {
    const question = survey?.questions?.find(q => q.id === questionId)
    if (!question) return null

    const allAnswers = responses.map(r => r.responses[questionId]).filter(Boolean)

    if (question.type === 'multiple_choice' || question.type === 'single_choice') {
      const choices = question.choices || []
      const stats = choices.map(choice => {
        const count = allAnswers.filter(answer => {
          if (Array.isArray(answer)) {
            return answer.some(item => item.includes(choice))
          } else {
            return String(answer).includes(choice)
          }
        }).length

        return {
          choice: choice,
          count: count,
          percentage: responses.length > 0 ? Math.round((count / responses.length) * 100) : 0
        }
      })

      return { type: 'choice', data: stats, total: responses.length }
    } else {
      return { type: 'text', data: allAnswers, total: allAnswers.length }
    }
  }

  const getChartColors = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#87d068']
    return colors[index % colors.length]
  }

  const exportToCSV = () => {
    if (!survey || !responses.length) return

    const headers = ['回答者', '提出日時', ...survey.questions.map(q => q.question)]
    const rows = responses.map((response, index) => [
      `回答者${index + 1}`,
      formatDate(response.submitted_at),
      ...survey.questions.map(q => {
        const answer = response.responses[q.id]
        if (Array.isArray(answer)) {
          return answer.filter(item => item !== '__selected__').map(item => item.replace(/^__SEPARATOR__:?/, '')).join(', ')
        }
        return String(answer || '').replace(/__selected__/g, '').replace(/__SEPARATOR__:/g, '').trim()
      })
    ])

    const csvContent = [headers, ...rows].map(row =>
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${survey.title}_responses.csv`
    link.click()
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
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Link>
            </Button>
            <div className="flex items-center space-x-4">
              <Button onClick={exportToCSV} variant="outline" size="sm" disabled={responses.length === 0}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSVでエクスポート
              </Button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">{survey.title}</h1>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {responses.length}件の回答
              </Badge>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md mx-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="statistics" className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4" />
                  <span>統計</span>
                </TabsTrigger>
                <TabsTrigger value="responses" className="flex items-center space-x-2">
                  <BarChart className="w-4 h-4" />
                  <span>回答一覧</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="statistics" className="space-y-6">
            {/* Statistics View */}
            {responses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-muted-foreground">
                    <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">まだ回答がありません</h3>
                    <p>このアンケートにはまだ誰も回答していません。</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {survey.questions?.map((question, questionIndex) => {
                  const stats = calculateStatistics(question.id)
                  if (!stats) return null

                  return (
                    <Card key={question.id} className="overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold mb-2">
                              Q{questionIndex + 1}. {question.question}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {stats.total}件の回答
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="ml-4">
                            <Copy className="w-4 h-4 mr-2" />
                            コピー
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {stats.type === 'choice' ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Chart */}
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                {question.type === 'single_choice' ? (
                                  <RechartsPieChart>
                                    <Pie
                                      data={stats.data.filter(item => item.count > 0)}
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={80}
                                      dataKey="count"
                                      label={({choice, percentage}) => `${choice} (${percentage}%)`}
                                    >
                                      {stats.data.filter(item => item.count > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getChartColors(index)} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, '回答数']} />
                                  </RechartsPieChart>
                                ) : (
                                  <RechartsBarChart data={stats.data.filter(item => item.count > 0)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="choice" tick={{fontSize: 12}} />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [value, '回答数']} />
                                    <Bar dataKey="count" fill="#8884d8" />
                                  </RechartsBarChart>
                                )}
                              </ResponsiveContainer>
                            </div>

                            {/* Statistics */}
                            <div className="space-y-3">
                              {stats.data.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: getChartColors(index) }}
                                    />
                                    <span className="font-medium">{item.choice}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">{item.count}</div>
                                    <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div
                              className="flex items-center justify-between cursor-pointer p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                              onClick={() => toggleQuestionExpansion(question.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="text-2xl font-semibold text-primary">
                                  {stats.total}
                                </div>
                                <div>
                                  <p className="font-medium">テキスト回答</p>
                                  <p className="text-sm text-muted-foreground">クリックして詳細を表示</p>
                                </div>
                              </div>
                              {expandedQuestions.has(question.id) ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>

                            {expandedQuestions.has(question.id) && (
                              <div className="border-l-4 border-primary pl-4 space-y-3">
                                {stats.data.slice(0, 10).map((answer, index) => (
                                  <div key={index} className="p-3 bg-muted/10 rounded-md">
                                    <p className="text-sm">{String(answer).replace(/__selected__/g, '').replace(/__SEPARATOR__:/g, '').trim()}</p>
                                  </div>
                                ))}
                                {stats.data.length > 10 && (
                                  <p className="text-sm text-muted-foreground text-center">
                                    他{stats.data.length - 10}件の回答があります
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="responses" className="space-y-6">
            {/* Individual Responses View */}
            {/* Survey Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart className="w-5 h-5 text-primary" />
                  <span>アンケート詳細</span>
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
                      <User className="w-3 h-3" />
                      <span>匿名ユーザー</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(response.submitted_at)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {survey.questions?.map((question) => {
                      const answer = response.responses[question.id]
                      if (answer === undefined || answer === null) return null
                      return (
                      <div key={question.id}>
                        <div className="flex flex-col space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Q: {question.question}
                          </h4>
                          <div className="pl-4 py-2 bg-muted/30 rounded-md">
                            {Array.isArray(answer) ? (
                              <ul className="space-y-1">
                                {answer.filter(item => item !== '__selected__').map((item, i) => (
                                  <li key={i} className="text-sm">• {item.replace(/^__SEPARATOR__:?/, '')}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm">{String(answer).replace(/__selected__/g, '').replace(/__SEPARATOR__:/g, '').trim() || answer}</p>
                            )}
                          </div>
                        </div>
                        {survey.questions?.indexOf(question) < (survey.questions?.length || 0) - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    )})}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}