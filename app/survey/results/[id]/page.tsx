"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { surveyEvents } from "@/lib/analytics"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock results data
const mockResults = {
  surveyTitle: "カフェの利用体験に関するアンケート",
  totalResponses: 247,
  myAnswers: {
    1: "週に2-3回",
    2: "4",
    3: "コーヒーの味",
    4: "もう少し静かな環境だと嬉しいです",
    5: "ぜひ利用したい",
  },
  questions: [
    {
      id: 1,
      question: "カフェを利用する頻度は？",
      type: "multiple_choice",
      data: [
        { name: "毎日", value: 45, color: "#0088FE" },
        { name: "週に4-5回", value: 67, color: "#00C49F" },
        { name: "週に2-3回", value: 89, color: "#FFBB28" },
        { name: "週に1回", value: 34, color: "#FF8042" },
        { name: "月に数回", value: 12, color: "#8884D8" },
      ],
    },
    {
      id: 2,
      question: "サービス満足度（1-5）",
      type: "rating",
      data: [
        { name: "1", value: 5 },
        { name: "2", value: 12 },
        { name: "3", value: 23 },
        { name: "4", value: 89 },
        { name: "5", value: 118 },
      ],
    },
  ],
}

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const results = mockResults
  
  useEffect(() => {
    surveyEvents.viewResults(id)
  }, [id])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Link>
            </Button>
            <h1 className="font-semibold text-foreground">アンケート結果</h1>
            <div className="w-[72px]"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Survey Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{results.surveyTitle}</CardTitle>
              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{results.totalResponses} 回答</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>ID: {id}</span>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Results Grid */}
        <div className="space-y-8">
          {results.questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">{question.question}</CardTitle>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {question.type === 'multiple_choice' ? '選択式' : 'レーティング'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    回答数: {(question.data as any[]).reduce((sum: number, item: any) => sum + item.value, 0)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {question.type === 'multiple_choice' ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {question.data.map((item) => {
                        const total = (question.data as any[]).reduce((sum: number, d: any) => sum + d.value, 0)
                        const percentage = (item.value / total) * 100
                        
                        return (
                          <div key={item.name} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-muted-foreground">
                                {item.value} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={question.data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {question.data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={(entry as any).color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={question.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Answers Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>あなたの回答</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(results.myAnswers).map(([questionId, answer]) => {
                const question = results.questions.find(q => q.id.toString() === questionId)
                return (
                  <div key={questionId} className="border-l-4 border-primary pl-4">
                    <p className="font-medium text-sm">{question?.question}</p>
                    <p className="text-muted-foreground mt-1">{answer}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}