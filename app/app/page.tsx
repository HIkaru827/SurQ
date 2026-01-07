"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { isDeveloperAccount } from '@/lib/developer'
import { authenticatedFetch } from '@/lib/api-client'
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Trophy, Zap, ArrowRight, PlusCircle, MessageSquare, Star, User, Mail } from "lucide-react"
import Link from "next/link"
import { NotificationBell } from "@/components/notifications/NotificationBell"

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
  updated_at: string
  has_answered?: boolean
}

export default function AppPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [userSurveys, setUserSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { user, userProfile, refreshProfile } = useAuth()
  
  const isDevAccount = user?.email ? isDeveloperAccount(user.email) : false


  useEffect(() => {
    // 並列実行で高速化
    Promise.all([
      fetchSurveys(),
      loadCurrentUser()
    ]).finally(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    // ユーザーログイン後にアンケート回答状況を再チェック
    if (user?.email && surveys.length > 0) {
      checkAnsweredStatus(surveys)
    }
  }, [user?.email])

  useEffect(() => {
    // ページがフォーカスされた時にプロフィールを更新
    const handleFocus = () => {
      if (user) {
        refreshProfile()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, refreshProfile])

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserSurveys()
    }
  }, [currentUser])

  const loadCurrentUser = () => {
    try {
      const userData = localStorage.getItem('currentUser')
      if (userData) {
        setCurrentUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const fetchSurveys = async () => {
    try {
      // キャッシュチェック
      const cachedSurveys = sessionStorage.getItem('cached_surveys')
      const cachedTime = sessionStorage.getItem('cached_surveys_time')
      
      if (cachedSurveys && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime)
        if (cacheAge < 30000) { // 30秒以内なら使用
          const surveys = JSON.parse(cachedSurveys)
          await checkAnsweredStatus(surveys)
          return
        }
      }

      const response = await fetch('/api/surveys')
      if (response.ok) {
        const data = await response.json()
        const surveys = data.surveys || []
        
        await checkAnsweredStatus(surveys)
        
        // キャッシュに保存
        sessionStorage.setItem('cached_surveys', JSON.stringify(surveys))
        sessionStorage.setItem('cached_surveys_time', Date.now().toString())
      }
    } catch (error) {
      console.error('Error fetching surveys:', error)
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
            const response = await authenticatedFetch(`/api/surveys/${survey.id}/responses?email=${encodeURIComponent(user.email!)}`)
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

  const fetchUserSurveys = async () => {
    if (!currentUser?.id || !user) return
    
    try {
      const response = await authenticatedFetch(`/api/surveys?creator_id=${currentUser.id}`)
      if (response.ok) {
        const data = await response.json()
        setUserSurveys(data.surveys || [])
      }
    } catch (error) {
      console.error('Error fetching user surveys:', error)
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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">SurQ</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              {userProfile && (
                <div className="flex items-center">
                  <Badge variant="secondary" className={`font-medium text-xs sm:text-sm px-2 py-1 ${isDevAccount ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-primary/10 text-primary border-primary/20'}`}>
                    {isDevAccount ? '∞pt' : `${userProfile.points?.toLocaleString() || '0'}pt`}
                  </Badge>
                </div>
              )}
              <NotificationBell />
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="p-2 sm:px-3">
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline text-sm">{currentUser ? `${currentUser.name}さん` : 'マイページ'}</span>
                </Button>
              </Link>
              <Link href="/survey/create">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent px-3 py-2"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">作成</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* User Surveys Section */}
      {currentUser && userSurveys.length > 0 && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">あなたのアンケート</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userSurveys.map((survey) => (
                  <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm sm:text-base lg:text-lg line-clamp-2 flex-1 leading-tight">
                          {survey.title}
                        </CardTitle>
                        <Badge 
                          variant={survey.is_published ? "default" : "secondary"}
                          className="text-xs px-2 py-1 shrink-0"
                        >
                          {survey.is_published ? "公開中" : "下書き"}
                        </Badge>
                      </div>
                      {survey.description && (
                        <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mt-1">
                          {survey.description}
                        </p>
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
                            <span className="text-xs sm:text-sm font-medium">
                              {survey.creator_points}pt消費
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {formatDate(survey.created_at)}
                          </Badge>
                        </div>

                        {survey.is_published ? (
                          <Link href={`/survey/${survey.id}`}>
                            <Button className="w-full h-9 sm:h-10" variant="outline">
                              <span className="text-xs sm:text-sm">アンケートを見る</span>
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/survey/create?edit=${survey.id}`}>
                            <Button className="w-full h-9 sm:h-10" variant="outline">
                              <span className="text-xs sm:text-sm">編集を続ける</span>
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Published Surveys Section */}
      <section id="surveys" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">公開中のアンケート</h2>
            <p className="text-xl text-muted-foreground mb-6">
              回答してポイントを獲得しましょう！
            </p>
            <Badge variant="secondary">{surveys.length}件のアンケート</Badge>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">読み込み中...</div>
            </div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                まだアンケートがありません
              </h3>
              <p className="text-muted-foreground mb-6">
                最初のアンケートを作成してみましょう！
              </p>
              <Link href="/survey/create">
                <Button>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  アンケートを作成
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {surveys.slice(0, 6).map((survey) => (
                <Card key={survey.id} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                  <CardHeader className="pb-3 p-4">
                    <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight">{survey.title}</CardTitle>
                    {survey.description && (
                      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 mt-1">
                        {survey.description}
                      </p>
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
                          <Button className="w-full h-9 sm:h-10" variant="outline">
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

          {surveys.length > 6 && (
            <div className="text-center">
              <Link href="/surveys">
                <Button variant="outline" size="lg">
                  すべてのアンケートを見る
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">SurQ</span>
            </div>

            <div className="flex items-center">
              <Link href="/contact">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  お問い合わせ
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 SurQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}