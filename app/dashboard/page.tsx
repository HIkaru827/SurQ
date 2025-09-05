"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  Clock,
  Download,
  Share2,
  Eye,
  RefreshCw,
  Calendar,
  Target,
  Send,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { authenticatedFetch } from "@/lib/api-client"
import { toast } from "sonner"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// Mock dashboard data
const mockDashboard = {
  overview: {
    totalSurveys: 12,
    totalResponses: 1847,
    avgCompletionRate: 78.5,
    avgResponseTime: "3.2分",
    activeSurveys: 5,
    thisMonthResponses: 423,
    responseGrowth: 12.3,
  },
  recentSurveys: [
    {
      id: "1",
      title: "カフェの利用体験に関するアンケート",
      status: "active",
      responses: 247,
      completionRate: 85.2,
      createdDate: "2024-03-15",
      lastResponse: "2時間前",
    },
    {
      id: "2",
      title: "新商品に関するアンケート",
      status: "active",
      responses: 156,
      completionRate: 72.1,
      createdDate: "2024-03-10",
      lastResponse: "30分前",
    },
    {
      id: "3",
      title: "働き方に関するアンケート",
      status: "completed",
      responses: 389,
      completionRate: 91.3,
      createdDate: "2024-02-28",
      lastResponse: "3日前",
    },
  ],
  responsesTrend: [
    { date: "3/1", responses: 45, completions: 38 },
    { date: "3/2", responses: 52, completions: 44 },
    { date: "3/3", responses: 38, completions: 31 },
    { date: "3/4", responses: 61, completions: 52 },
    { date: "3/5", responses: 49, completions: 41 },
    { date: "3/6", responses: 67, completions: 58 },
    { date: "3/7", responses: 71, completions: 63 },
  ],
  demographics: {
    age: [
      { name: "18-24", value: 23, color: "#059669" },
      { name: "25-34", value: 35, color: "#10b981" },
      { name: "35-44", value: 28, color: "#34d399" },
      { name: "45-54", value: 10, color: "#6ee7b7" },
      { name: "55+", value: 4, color: "#a7f3d0" },
    ],
    gender: [
      { name: "男性", value: 45, color: "#059669" },
      { name: "女性", value: 52, color: "#10b981" },
      { name: "その他", value: 3, color: "#34d399" },
    ],
  },
  topPerforming: [
    { title: "働き方に関するアンケート", responses: 389, rate: 91.3 },
    { title: "カフェの利用体験に関するアンケート", responses: 247, rate: 85.2 },
    { title: "新商品に関するアンケート", responses: 156, rate: 72.1 },
  ],
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("7d")
  const [selectedSurvey, setSelectedSurvey] = useState("all")
  const { user } = useAuth()
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationContent, setNotificationContent] = useState("")
  const [isNotificationSending, setIsNotificationSending] = useState(false)
  
  // Check if user is admin
  const isAdmin = user?.email === 'hikarujin167@gmail.com'
  
  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationContent.trim()) {
      toast.error("通知のタイトルと内容を入力してください")
      return
    }
    
    setIsNotificationSending(true)
    try {
      const response = await authenticatedFetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: notificationTitle,
          content: notificationContent
        })
      })
      
      if (!response.ok) {
        throw new Error('通知の送信に失敗しました')
      }
      
      toast.success("全ユーザーに通知を送信しました")
      setNotificationTitle("")
      setNotificationContent("")
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error("通知の送信に失敗しました")
    } finally {
      setIsNotificationSending(false)
    }
  }

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
            <h1 className="font-semibold text-foreground">アナリティクス</h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                更新
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                エクスポート
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">過去7日間</SelectItem>
              <SelectItem value="30d">過去30日間</SelectItem>
              <SelectItem value="90d">過去90日間</SelectItem>
              <SelectItem value="1y">過去1年間</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="アンケートを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのアンケート</SelectItem>
              {mockDashboard.recentSurveys.map((survey) => (
                <SelectItem key={survey.id} value={survey.id}>
                  {survey.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">総アンケート数</p>
                  <p className="text-2xl font-bold text-foreground">{mockDashboard.overview.totalSurveys}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">総回答数</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockDashboard.overview.totalResponses.toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+{mockDashboard.overview.responseGrowth}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">平均完了率</p>
                  <p className="text-2xl font-bold text-foreground">{mockDashboard.overview.avgCompletionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">平均回答時間</p>
                  <p className="text-2xl font-bold text-foreground">{mockDashboard.overview.avgResponseTime}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Response Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>回答トレンド</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockDashboard.responsesTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="responses"
                        stackId="1"
                        stroke="#059669"
                        fill="#059669"
                        fillOpacity={0.6}
                        name="開始数"
                      />
                      <Area
                        type="monotone"
                        dataKey="completions"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.8}
                        name="完了数"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Survey Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>アンケート別パフォーマンス</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockDashboard.topPerforming}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="responses" fill="#059669" radius={[4, 4, 0, 0]} name="回答数" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>回答者属性</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="age" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="age">年齢</TabsTrigger>
                    <TabsTrigger value="gender">性別</TabsTrigger>
                  </TabsList>
                  <TabsContent value="age">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockDashboard.demographics.age}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                            labelLine={false}
                          >
                            {mockDashboard.demographics.age.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  <TabsContent value="gender">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockDashboard.demographics.gender}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                            labelLine={false}
                          >
                            {mockDashboard.demographics.gender.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Recent Surveys */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>最近のアンケート</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDashboard.recentSurveys.map((survey) => (
                    <div key={survey.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm text-foreground line-clamp-2">{survey.title}</h4>
                        <Badge variant={survey.status === "active" ? "default" : "secondary"} className="ml-2">
                          {survey.status === "active" ? "実施中" : "完了"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{survey.responses}件の回答</span>
                        <span>完了率 {survey.completionRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">最終回答: {survey.lastResponse}</span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/survey/results/${survey.id}`}>
                            <Eye className="w-3 h-3 mr-1" />
                            詳細
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Admin Notification Panel */}
            {isAdmin && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-800">
                    <Shield className="w-5 h-5" />
                    <span>管理者機能 - 全体通知</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-title">通知タイトル</Label>
                    <Input
                      id="notification-title"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder="例: システムメンテナンスのお知らせ"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-content">通知内容</Label>
                    <Textarea
                      id="notification-content"
                      value={notificationContent}
                      onChange={(e) => setNotificationContent(e.target.value)}
                      placeholder="例: 明日の午前2時〜4時の間、システムメンテナンスを実施いたします。"
                      rows={4}
                      className="bg-white"
                    />
                  </div>
                  <Button 
                    onClick={handleSendNotification}
                    disabled={isNotificationSending || !notificationTitle.trim() || !notificationContent.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isNotificationSending ? "送信中..." : "全ユーザーに通知を送信"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/survey/create">新しいアンケートを作成</Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Share2 className="w-4 h-4 mr-2" />
                  レポートを共有
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  データをエクスポート
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
