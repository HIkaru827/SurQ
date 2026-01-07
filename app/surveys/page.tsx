"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users, Star, Trophy, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface Survey {
  id: string
  title: string
  description: string | null
  creator_id: string
  questions: any[]
  is_published: boolean
  response_count: number
  respondent_points: number
  created_at: string
  updated_at: string
  has_answered?: boolean
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchSurveys()
  }, [])

  useEffect(() => {
    // ユーザーログイン後にアンケート回答状況を再チェック
    if (user?.email && surveys.length > 0) {
      checkAnsweredStatus(surveys)
    }
  }, [user?.email])

  const fetchSurveys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/surveys')
      if (response.ok) {
        const data = await response.json()
        const surveys = data.surveys || []
        
        if (user?.email) {
          await checkAnsweredStatus(surveys)
        } else {
          setSurveys(surveys)
        }
      } else {
        console.error('Failed to fetch surveys:', response.statusText)
        setSurveys([])
      }
    } catch (error) {
      console.error('Error fetching surveys:', error)
      setSurveys([])
    } finally {
      setLoading(false)
    }
  }

  const checkAnsweredStatus = async (surveys: Survey[]) => {
    if (!user?.email) {
      setSurveys(surveys)
      return
    }

    try {
      // 各アンケートの回答状況をチェック
      const surveysWithStatus = await Promise.all(
        surveys.map(async (survey) => {
          try {
            const response = await fetch(`/api/surveys/${survey.id}/responses?email=${encodeURIComponent(user.email!)}`)
            if (response.ok) {
              const data = await response.json()
              return { ...survey, has_answered: data.hasResponded }
            }
          } catch (error) {
            console.error(`Error checking response for survey ${survey.id}:`, error)
          }
          return { ...survey, has_answered: false }
        })
      )
      setSurveys(surveysWithStatus)
    } catch (error) {
      console.error('Error checking answered status:', error)
      setSurveys(surveys)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/app">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  戻る
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold text-foreground">SurQ</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            すべてのアンケート
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            回答してポイントを獲得しましょう！
          </p>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {loading ? '読み込み中...' : `${surveys.length}件のアンケート`}
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">アンケートを読み込み中...</p>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-24">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              まだアンケートがありません
            </h3>
            <p className="text-muted-foreground mb-6">
              最初のアンケートを作成してみましょう！
            </p>
            <Link href="/survey/create">
              <Button>
                アンケートを作成
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <Card key={survey.id} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardHeader className="pb-3 p-4">
                  <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight">
                    {survey.title}
                  </CardTitle>
                  {survey.description && (
                    <CardDescription className="text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 mt-1">
                      {survey.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        <span>{survey.questions?.length || 0}問</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        <span>{survey.response_count}回答</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                        <span className="text-xs sm:text-sm font-medium text-green-600">
                          +{survey.respondent_points}pt
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {formatDate(survey.created_at)}
                      </Badge>
                    </div>

                    {survey.has_answered ? (
                      <Button className="w-full h-9 sm:h-10" variant="secondary" disabled>
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">回答済み</span>
                      </Button>
                    ) : (
                      <Link href={`/survey/${survey.id}`}>
                        <Button className="w-full h-9 sm:h-10" variant="default">
                          <span className="text-xs sm:text-sm">回答する</span>
                        </Button>
                      </Link>
                    )}
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

