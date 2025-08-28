"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Trophy, Zap, ArrowRight, PlusCircle, MessageSquare, Star, User } from "lucide-react"
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
  creator_points: number
  created_at: string
  updated_at: string
}

export default function AppPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [userSurveys, setUserSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchSurveys()
    loadCurrentUser()
  }, [])

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
      const response = await fetch('/api/surveys')
      if (response.ok) {
        const data = await response.json()
        setSurveys(data.surveys || [])
      }
    } catch (error) {
      console.error('Error fetching surveys:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserSurveys = async () => {
    if (!currentUser?.id) return
    
    try {
      const response = await fetch(`/api/surveys?creator_id=${currentUser.id}`)
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
            <div className="flex items-center space-x-3">
              <Link href="/profile">
                <Button variant="ghost" size="default">
                  <User className="w-5 h-5 mr-2" />
                  {currentUser ? `${currentUser.name}さん` : 'マイページ'}
                </Button>
              </Link>
              <Button
                variant="default"
                size="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => {
                  const surveysSection = document.getElementById('surveys')
                  if (surveysSection) {
                    surveysSection.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                回答する
              </Button>
              <Link href="/survey/create">
                <Button
                  variant="outline"
                  size="default"
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  作成する
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userSurveys.map((survey) => (
                  <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-1">{survey.title}</CardTitle>
                        <Badge variant={survey.is_published ? "default" : "secondary"}>
                          {survey.is_published ? "公開中" : "下書き"}
                        </Badge>
                      </div>
                      {survey.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {survey.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span>{survey.questions?.length || 0}問</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{survey.response_count}回答</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">
                              {survey.creator_points}pt消費
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(survey.created_at)}
                          </Badge>
                        </div>

                        {survey.is_published ? (
                          <Link href={`/survey/${survey.id}`}>
                            <Button className="w-full" variant="outline">
                              アンケートを見る
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/survey/create?edit=${survey.id}`}>
                            <Button className="w-full" variant="outline">
                              編集を続ける
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
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">{survey.title}</CardTitle>
                    {survey.description && (
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {survey.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span>{survey.questions?.length || 0}問</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{survey.response_count}回答</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-green-600">
                            +{survey.respondent_points}pt
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(survey.created_at)}
                        </Badge>
                      </div>

                      <Link href={`/survey/${survey.id}`}>
                        <Button className="w-full" variant="outline">
                          回答する
                        </Button>
                      </Link>
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
    </div>
  )
}