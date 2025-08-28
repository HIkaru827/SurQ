"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
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
  results: [
    {
      question: "どのくらいの頻度でカフェを利用しますか？",
      type: "pie",
      data: [
        { name: "毎日", value: 15, color: "#059669" },
        { name: "週に2-3回", value: 35, color: "#10b981" },
        { name: "週に1回", value: 25, color: "#34d399" },
        { name: "月に数回", value: 20, color: "#6ee7b7" },
        { name: "ほとんど利用しない", value: 5, color: "#a7f3d0" },
      ],
    },
    {
      question: "当店のサービスに満足していますか？",
      type: "bar",
      data: [
        { name: "1", value: 3 },
        { name: "2", value: 8 },
        { name: "3", value: 25 },
        { name: "4", value: 45 },
        { name: "5", value: 19 },
      ],
    },
  ],
}

export default function SurveyResultsPage({ params }: { params: { id: string } }) {
  const results = mockResults

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Link>
            </Button>
            <div className="text-center">
              <h1 className="font-semibold text-foreground">アンケート結果</h1>
              <div className="flex items-center justify-center space-x-4 mt-1">
                <Badge variant="secondary">
                  <Users className="w-3 h-3 mr-1" />
                  {results.totalResponses}人が回答
                </Badge>
              </div>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Survey Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>{results.surveyTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{results.totalResponses}</div>
                  <div className="text-sm text-muted-foreground">総回答数</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">4.2</div>
                  <div className="text-sm text-muted-foreground">平均満足度</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">89%</div>
                  <div className="text-sm text-muted-foreground">再利用意向</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Results */}
          {results.results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{result.question}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">あなたの回答</Badge>
                  <span className="text-primary font-medium">
                    {results.myAnswers[(index + 1) as keyof typeof results.myAnswers]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {result.type === "pie" && (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={result.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name} (${value}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {result.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {result.type === "bar" && (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Individual Response Breakdown */}
                <div className="mt-6 space-y-3">
                  {result.data.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">{item.name}</span>
                      <div className="flex items-center space-x-3 flex-1 max-w-xs">
                        <Progress value={item.value} className="flex-1" />
                        <span className="text-sm font-medium w-12 text-right">{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/survey/create">新しいアンケートを作成</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">ホームに戻る</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
